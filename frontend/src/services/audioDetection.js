// frontend/src/services/audioDetection.js
class AudioDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.javascriptNode = null;
    this.NOISE_THRESHOLD = 40;
    this.consecutiveNoiseFrames = 0;
  }
  
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.fftSize = 1024;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
      
      this.microphone.connect(this.analyser);
      this.analyser.connect(this.javascriptNode);
      this.javascriptNode.connect(this.audioContext.destination);
      
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }
  
  startDetection(callback) {
    this.javascriptNode.onaudioprocess = () => {
      const array = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(array);
      
      const average = array.reduce((a, b) => a + b) / array.length;
      
      if (average > this.NOISE_THRESHOLD) {
        this.consecutiveNoiseFrames++;
        
        if (this.consecutiveNoiseFrames > 10) { // ~0.5 seconds of noise
          callback({
            type: 'BACKGROUND_NOISE',
            timestamp: Date.now(),
            level: average,
            message: 'Background noise/voices detected'
          });
          this.consecutiveNoiseFrames = 0;
        }
      } else {
        this.consecutiveNoiseFrames = 0;
      }
    };
  }
  
  stop() {
    if (this.microphone) this.microphone.disconnect();
    if (this.javascriptNode) this.javascriptNode.disconnect();
    if (this.audioContext) this.audioContext.close();
  }
}

export default AudioDetector;