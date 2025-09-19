// frontend/src/services/focusDetection.js
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

class FocusDetector {
  constructor() {
    this.model = null;
    this.lastFaceTime = Date.now();
    this.lastLookingTime = Date.now();
    this.events = [];
    this.lastFace = null;
  }

  async initialize() {
    try {
      // Create detector using the new API
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      this.model = await faceLandmarksDetection.createDetector(model, {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 2
      });
      console.log('Face detection model loaded successfully');
    } catch (error) {
      console.error('Error loading face detection model:', error);
      throw error;
    }
  }

  async detectFocus(video) {
    if (!this.model || !video) return null;

    try {
      const faces = await this.model.estimateFaces(video);
      
      const currentTime = Date.now();
      const result = {
        faceDetected: faces.length > 0,
        multipleFaces: faces.length > 1,
        lookingAtScreen: false,
        events: []
      };

      // Check multiple faces
      if (result.multipleFaces) {
        result.events.push({
          type: 'MULTIPLE_FACES',
          timestamp: currentTime,
          message: `${faces.length} faces detected in frame`
        });
      }

      // Check face presence
      if (!result.faceDetected) {
        const noFaceDuration = (currentTime - this.lastFaceTime) / 1000;
        if (noFaceDuration > 10) {
          result.events.push({
            type: 'NO_FACE',
            timestamp: currentTime,
            duration: noFaceDuration,
            message: `No face detected for ${Math.round(noFaceDuration)} seconds`
          });
        }
      } else {
        this.lastFaceTime = currentTime;
        this.lastFace = faces[0];
        
        // Check if looking at screen
        result.lookingAtScreen = this.isLookingAtScreen(faces[0]);
        
        if (!result.lookingAtScreen) {
          const lookAwayDuration = (currentTime - this.lastLookingTime) / 1000;
          if (lookAwayDuration > 5) {
            result.events.push({
              type: 'LOOKING_AWAY',
              timestamp: currentTime,
              duration: lookAwayDuration,
              message: `Looking away for ${Math.round(lookAwayDuration)} seconds`
            });
          }
        } else {
          this.lastLookingTime = currentTime;
        }
      }

      return result;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  isLookingAtScreen(face) {
    if (!face || !face.keypoints) return true;
    
    try {
      // Get key facial landmarks
      const nose = face.keypoints.find(kp => kp.name === 'noseTip');
      const leftEye = face.keypoints.find(kp => kp.name === 'leftEye');
      const rightEye = face.keypoints.find(kp => kp.name === 'rightEye');
      
      if (!nose || !leftEye || !rightEye) return true;
      
      // Simple heuristic: check if face is roughly centered
      // This is a simplified check - you can make it more sophisticated
      const videoWidth = 640;
      const centerX = videoWidth / 2;
      const noseX = nose.x;
      
      // If nose is too far from center, person might be looking away
      const tolerance = videoWidth * 0.3; // 30% tolerance
      const isCenter = Math.abs(noseX - centerX) < tolerance;
      
      return isCenter;
    } catch (error) {
      console.error('Error checking gaze:', error);
      return true;
    }
  }
}

export default FocusDetector;