// frontend/src/services/drowsinessDetection.js (complete version)
class DrowsinessDetector {
  constructor() {
    this.eyeClosureFrames = 0;
    this.DROWSINESS_THRESHOLD = 30; // frames (approximately 3 seconds at 10fps)
    this.blinkCounter = 0;
    this.lastBlinkTime = Date.now();
    this.EXCESSIVE_BLINK_THRESHOLD = 5; // blinks in 10 seconds
  }
  
  detectDrowsiness(face) {
    if (!face || !face.annotations) return null;
    
    const leftEye = face.annotations.leftEyeLower0;
    const rightEye = face.annotations.rightEyeLower0;
    
    if (!leftEye || !rightEye) return null;
    
    // Calculate Eye Aspect Ratio (EAR)
    const leftEAR = this.calculateEAR(
      face.annotations.leftEyeUpper0,
      face.annotations.leftEyeLower0,
      face.annotations.leftEyeIris
    );
    const rightEAR = this.calculateEAR(
      face.annotations.rightEyeUpper0,
      face.annotations.rightEyeLower0,
      face.annotations.rightEyeIris
    );
    
    const avgEAR = (leftEAR + rightEAR) / 2;
    const EAR_THRESHOLD = 0.25;
    
    const currentTime = Date.now();
    
    if (avgEAR < EAR_THRESHOLD) {
      this.eyeClosureFrames++;
      
      // Check for prolonged eye closure (drowsiness)
      if (this.eyeClosureFrames > this.DROWSINESS_THRESHOLD) {
        this.eyeClosureFrames = 0; // Reset counter
        return {
          type: 'DROWSINESS',
          timestamp: currentTime,
          message: 'Possible drowsiness detected - eyes closed for extended period',
          severity: 'high'
        };
      }
    } else {
      // Eye is open
      if (this.eyeClosureFrames > 5 && this.eyeClosureFrames < this.DROWSINESS_THRESHOLD) {
        // This was a blink
        this.blinkCounter++;
        
        // Check for excessive blinking
        if (currentTime - this.lastBlinkTime < 10000) { // Within 10 seconds
          if (this.blinkCounter > this.EXCESSIVE_BLINK_THRESHOLD) {
            this.blinkCounter = 0;
            return {
              type: 'DROWSINESS',
              timestamp: currentTime,
              message: 'Excessive blinking detected - possible fatigue',
              severity: 'medium'
            };
          }
        } else {
          // Reset blink counter after 10 seconds
          this.blinkCounter = 1;
          this.lastBlinkTime = currentTime;
        }
      }
      
      this.eyeClosureFrames = 0;
    }
    
    return null;
  }
  
  calculateEAR(upperEye, lowerEye, iris) {
    if (!upperEye || !lowerEye || upperEye.length < 3 || lowerEye.length < 3) {
      return 1; // Default to "eye open" if landmarks are missing
    }
    
    try {
      // Calculate vertical eye distances
      const v1 = this.euclideanDistance(upperEye[1], lowerEye[1]);
      const v2 = this.euclideanDistance(upperEye[2], lowerEye[2]);
      
      // Calculate horizontal eye distance
      const h = this.euclideanDistance(upperEye[0], upperEye[upperEye.length - 1]);
      
      // Eye Aspect Ratio
      const ear = (v1 + v2) / (2.0 * h);
      
      return ear;
    } catch (error) {
      console.error('Error calculating EAR:', error);
      return 1;
    }
  }
  
  euclideanDistance(point1, point2) {
    if (!point1 || !point2 || point1.length < 2 || point2.length < 2) {
      return 0;
    }
    
    const dx = point1[0] - point2[0];
    const dy = point1[1] - point2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  reset() {
    this.eyeClosureFrames = 0;
    this.blinkCounter = 0;
    this.lastBlinkTime = Date.now();
  }
}

export default DrowsinessDetector;