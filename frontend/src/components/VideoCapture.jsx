// frontend/src/components/VideoCapture.jsx
import React, { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const VideoCapture = React.memo(({ onFrameCapture }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let currentStream = null;
    
    const setupCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        
        currentStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error('Camera access denied:', err);
        toast.error('Camera access denied. Please enable camera permissions.');
      }
    };
    
    setupCamera();
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array for mount/unmount only

  useEffect(() => {
    if (!stream || !onFrameCapture) return;
    
    // Capture frame every 100ms for analysis
    intervalRef.current = setInterval(() => {
      if (videoRef.current && onFrameCapture) {
        onFrameCapture(videoRef.current);
      }
    }, 100);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream, onFrameCapture]); // Separate effect for frame capture

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', maxWidth: '640px', borderRadius: '8px' }}
      />
    </div>
  );
});

VideoCapture.displayName = 'VideoCapture';

export default VideoCapture;