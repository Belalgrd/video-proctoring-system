// frontend/src/services/objectDetection.js
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

class ObjectDetector {
  constructor() {
    this.model = null;
    this.suspiciousObjects = [
      'cell phone', 'book', 'laptop', 'tv', 'keyboard', 
      'mouse', 'remote', 'tablet'
    ];
  }

  async initialize() {
    try {
      // Wait for TensorFlow to be ready
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // Load the model
      this.model = await cocoSsd.load();
      console.log('Object detection model loaded successfully');
    } catch (error) {
      console.error('Error loading object detection model:', error);
      // Continue without object detection rather than crashing
      this.model = null;
    }
  }

  async detectObjects(video) {
    if (!this.model || !video) return [];

    try {
      const predictions = await this.model.detect(video);
      const suspiciousItems = [];

      predictions.forEach(prediction => {
        if (this.suspiciousObjects.includes(prediction.class)) {
          suspiciousItems.push({
            type: 'SUSPICIOUS_OBJECT',
            object: prediction.class,
            confidence: prediction.score,
            timestamp: Date.now(),
            message: `${prediction.class} detected with ${Math.round(prediction.score * 100)}% confidence`
          });
        }
      });

      return suspiciousItems;
    } catch (error) {
      console.error('Object detection error:', error);
      return [];
    }
  }
}

export default ObjectDetector;