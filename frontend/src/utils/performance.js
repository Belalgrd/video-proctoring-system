// frontend/src/utils/performance.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      detectionTime: []
    };
    this.lastFrameTime = performance.now();
  }
  
  measureFPS() {
    const currentTime = performance.now();
    const fps = 1000 / (currentTime - this.lastFrameTime);
    this.lastFrameTime = currentTime;
    
    this.metrics.fps.push(fps);
    if (this.metrics.fps.length > 100) {
      this.metrics.fps.shift();
    }
    
    return fps;
  }
  
  measureMemory() {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
      this.metrics.memory.push(memoryUsage);
      
      if (this.metrics.memory.length > 100) {
        this.metrics.memory.shift();
      }
      
      return memoryUsage;
    }
    return null;
  }
  
  async measureDetectionTime(detectionFunction) {
    const startTime = performance.now();
    const result = await detectionFunction();
    const endTime = performance.now();
    
    const detectionTime = endTime - startTime;
    this.metrics.detectionTime.push(detectionTime);
    
    if (this.metrics.detectionTime.length > 100) {
      this.metrics.detectionTime.shift();
    }
    
    return { result, time: detectionTime };
  }
  
  getAverageMetrics() {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;
    
    return {
      avgFPS: avg(this.metrics.fps),
      avgMemory: avg(this.metrics.memory),
      avgDetectionTime: avg(this.metrics.detectionTime)
    };
  }
  
  logMetrics() {
    const metrics = this.getAverageMetrics();
    console.log('Performance Metrics:', {
      'Average FPS': metrics.avgFPS.toFixed(2),
      'Average Memory (MB)': metrics.avgMemory.toFixed(2),
      'Average Detection Time (ms)': metrics.avgDetectionTime.toFixed(2)
    });
  }
}

export default PerformanceMonitor;