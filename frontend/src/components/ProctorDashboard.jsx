// frontend/src/components/ProctorDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCapture from './VideoCapture';
import AlertsPanel from './AlertsPanel';
import FocusDetector from '../services/focusDetection';
import ObjectDetector from '../services/objectDetection';
import DrowsinessDetector from '../services/drowsinessDetection';
import AudioDetector from '../services/audioDetection';
import { socket, api } from '../services/api';
import toast from 'react-hot-toast';
import './ProctorDashboard.css';

const ProctorDashboard = ({ onSessionEnd }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState([]);
  const [integrityScore, setIntegrityScore] = useState(100);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  const navigate = useNavigate();
  const focusDetector = useRef(null);
  const objectDetector = useRef(null);
  const drowsinessDetector = useRef(null);
  const audioDetector = useRef(null);
  const intervalRef = useRef(null);
  const sessionIdRef = useRef(null); // Store sessionId in ref for immediate access

  // Debug logging
  useEffect(() => {
    console.log('State update:', {
      isRecording,
      sessionId,
      sessionDuration,
      startTime,
      timerRunning: !!intervalRef.current
    });
  }, [isRecording, sessionId, sessionDuration, startTime]);

  // Process events callback
  const processEvents = useCallback((newEvents) => {
    if (!newEvents || newEvents.length === 0) return;

    setEvents(prev => [...prev, ...newEvents]);
    
    // Calculate integrity deductions
    let totalDeduction = 0;
    newEvents.forEach(event => {
      let deduction = 0;
      switch(event.type) {
        case 'NO_FACE': 
          deduction = 10; 
          break;
        case 'LOOKING_AWAY': 
          deduction = 5; 
          break;
        case 'MULTIPLE_FACES': 
          deduction = 15; 
          break;
        case 'SUSPICIOUS_OBJECT': 
          deduction = 20; 
          break;
        case 'DROWSINESS': 
          deduction = 10; 
          break;
        case 'BACKGROUND_NOISE': 
          deduction = 5; 
          break;
        default: 
          deduction = 0;
          break;
      }
      totalDeduction += deduction;
    });
    
    setIntegrityScore(prev => Math.max(0, prev - totalDeduction));

    // Send events to backend
    if (sessionIdRef.current && isRecording) {
      api.logEvents(sessionIdRef.current, newEvents).catch(console.error);
      socket.emit('proctoring-event', { 
        sessionId: sessionIdRef.current, 
        candidateName: sessionStorage.getItem('candidateName'),
        events: newEvents 
      });
    }

    // Show toast for critical events
    newEvents.forEach(event => {
      if (event.type === 'SUSPICIOUS_OBJECT' || event.type === 'MULTIPLE_FACES') {
        toast.error(event.message);
      }
    });
  }, [isRecording]);

  // Initialize detectors
  useEffect(() => {
    const initializeDetectors = async () => {
      setIsLoading(true);
      let initErrors = [];
      
      try {
        // Initialize detectors with error handling for each
        focusDetector.current = new FocusDetector();
        objectDetector.current = new ObjectDetector();
        drowsinessDetector.current = new DrowsinessDetector();
        audioDetector.current = new AudioDetector();

        // Try to initialize each detector
        try {
          await focusDetector.current.initialize();
          console.log('✓ Focus detector initialized');
        } catch (e) {
          console.error('✗ Focus detector failed:', e);
          initErrors.push('Face detection');
        }

        try {
          await objectDetector.current.initialize();
          console.log('✓ Object detector initialized');
        } catch (e) {
          console.error('✗ Object detector failed:', e);
          initErrors.push('Object detection');
        }

        try {
          const audioInitialized = await audioDetector.current.initialize();
          if (audioInitialized) {
            audioDetector.current.startDetection((event) => {
              processEvents([event]);
            });
            console.log('✓ Audio detector initialized');
          }
        } catch (e) {
          console.error('✗ Audio detector failed:', e);
          initErrors.push('Audio detection');
        }

        if (initErrors.length > 0) {
          toast.warning(`Some features unavailable: ${initErrors.join(', ')}`);
        } else {
          toast.success('All detection systems ready');
        }
      } catch (error) {
        console.error('Critical initialization error:', error);
        toast.error('Failed to initialize detection systems');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeDetectors();

    // Cleanup on unmount
    return () => {
      if (audioDetector.current) {
        audioDetector.current.stop();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [processEvents]);

  // Timer effect
  useEffect(() => {
    if (isRecording && startTime) {
      console.log('Starting timer...');
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionDuration(elapsed);
      }, 1000);
      
      return () => {
        if (intervalRef.current) {
          console.log('Cleaning up timer');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isRecording, startTime]);

  const startSession = async () => {
    try {
      const candidateName = sessionStorage.getItem('candidateName') || 'Anonymous';
      console.log('Starting session for:', candidateName);
      
      const response = await api.createSession({
        candidateName,
        startTime: Date.now()
      });
      
      console.log('Session created:', response);
      
      if (response && response._id) {
        // Store session ID in both state and ref
        const newSessionId = response._id;
        setSessionId(newSessionId);
        sessionIdRef.current = newSessionId;
        
        // Set recording state and start time
        setIsRecording(true);
        setStartTime(Date.now());
        setSessionDuration(0);
        
        toast.success('Interview started successfully');
      } else {
        throw new Error('Invalid session response');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session. Please check your connection.');
      setIsRecording(false);
    }
  };

  const endSession = async () => {
    try {
      console.log('Ending session:', sessionIdRef.current);
      
      // Stop the timer first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Update recording state
      setIsRecording(false);

      // Check if we have a session to end
      if (!sessionIdRef.current) {
        console.error('No session ID found');
        toast.error('No active session to end');
        return;
      }

      // Call the API to end the session
      const finalSession = await api.endSession(sessionIdRef.current);
      console.log('Session ended:', finalSession);
      
      // Create complete session data
      const completeSession = {
        ...finalSession,
        events: events,
        integrityScore: integrityScore,
        duration: sessionDuration
      };
      
      // Call parent callback if provided
      if (onSessionEnd) {
        onSessionEnd(completeSession);
      }
      
      toast.success('Interview ended successfully');
      
      // Clear session data
      sessionIdRef.current = null;
      setSessionId(null);
      setStartTime(null);
      
      // Navigate to report after a short delay
      setTimeout(() => {
        navigate('/report');
      }, 500);
      
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error(`Failed to end session: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFrameCapture = useCallback(async (video) => {
    if (!isRecording || !video) return;

    try {
      // Focus detection
      const focusResult = await focusDetector.current?.detectFocus(video);
      if (focusResult?.events.length > 0) {
        processEvents(focusResult.events);
      }

      // Drowsiness detection (if face is detected)
      if (focusResult?.faceDetected && focusDetector.current?.lastFace) {
        const drowsinessEvent = drowsinessDetector.current?.detectDrowsiness(
          focusDetector.current.lastFace
        );
        if (drowsinessEvent) {
          processEvents([drowsinessEvent]);
        }
      }

      // Object detection
      const suspiciousObjects = await objectDetector.current?.detectObjects(video);
      if (suspiciousObjects?.length > 0) {
        processEvents(suspiciousObjects);
      }
    } catch (error) {
      console.error('Detection error:', error);
    }
  }, [isRecording, processEvents]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="proctor-dashboard">
      {isLoading ? (
        <div className="loading-screen">
          <div className="loader"></div>
          <p>Initializing detection systems...</p>
        </div>
      ) : (
        <div className="main-content">
          <div className="video-section">
            <div className="header">
              <h2>Interview Session</h2>
              {isRecording && (
                <div className="recording-indicator">
                  <span className="rec-dot"></span>
                  Recording - {formatTime(sessionDuration)}
                </div>
              )}
            </div>
            
            <VideoCapture onFrameCapture={handleFrameCapture} />
            
            <div className="controls">
              <button 
                onClick={startSession} 
                disabled={isRecording}
                className="start-btn"
              >
                <span>🎥</span> Start Interview
              </button>
              <button 
                onClick={endSession} 
                disabled={!isRecording}
                className="end-btn"
              >
                <span>⏹️</span> End Interview
              </button>
            </div>
            
            <div className="instructions">
              <h4>Instructions:</h4>
              <ul>
                <li>Ensure good lighting and clear visibility</li>
                <li>Keep your face in the frame at all times</li>
                <li>Avoid looking away from the screen</li>
                <li>No phones, books, or external devices allowed</li>
              </ul>
            </div>
          </div>
          
          <div className="stats-section">
            <div className="integrity-score">
              <h3>Integrity Score</h3>
                            <div className={`score ${
                integrityScore < 50 ? 'danger' : 
                integrityScore < 75 ? 'warning' : ''
              }`}>
                {integrityScore}%
              </div>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ width: `${integrityScore}%` }}
                />
              </div>
            </div>
            
            <AlertsPanel events={events} />
            
            {isRecording && (
              <div className="live-stats">
                <h4>Session Stats</h4>
                <div className="stat">
                  <span>Total Alerts:</span>
                  <span>{events.length}</span>
                </div>
                <div className="stat">
                  <span>Duration:</span>
                  <span>{formatTime(sessionDuration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctorDashboard;