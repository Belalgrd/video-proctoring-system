// frontend/src/components/InterviewerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { socket } from '../services/api';
import toast from 'react-hot-toast';
import './InterviewerDashboard.css';

const InterviewerDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  useEffect(() => {
    // Fetch active sessions
    fetchSessions();
    
    socket.on('candidate-alert', (data) => {
      const alert = {
        id: Date.now(),
        sessionId: data.sessionId,
        candidateName: data.candidateName || 'Unknown',
        events: data.events,
        timestamp: new Date()
      };
      
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep only last 50 alerts
      
      // Show toast notification
      data.events.forEach(event => {
        toast(event.message, {
          icon: '⚠️',
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#333',
            color: '#fff',
          }
        });
      });
    });
    
    socket.on('new-session', (session) => {
      setSessions(prev => [session, ...prev]);
      toast.success(`New session started: ${session.candidateName}`);
    });
    
    socket.on('session-ended', (data) => {
      setSessions(prev => prev.filter(s => s.id !== data.sessionId));
      toast(`Session ended: ${data.candidateName}`, { icon: '📋' });
    });
    
    return () => {
      socket.off('candidate-alert');
      socket.off('new-session');
      socket.off('session-ended');
    };
  }, []);
  
  const fetchSessions = async () => {
    try {
      // TODO: Implement actual API call
      // const response = await api.getAllSessions();
      // setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    }
  };
  
  return (
    <div className="interviewer-dashboard">
      <h1>Interviewer Dashboard</h1>
      
      <div className="active-sessions">
        <h2>Active Sessions ({sessions.length})</h2>
        <div className="sessions-grid">
          {sessions.map(session => (
            <div key={session.id} className="session-card">
              <h3>{session.candidateName}</h3>
              <p>Score: {session.integrityScore || 100}%</p>
              <div className="live-indicator">🔴 LIVE</div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="no-sessions">No active sessions</p>
          )}
        </div>
      </div>
      
      <div className="recent-alerts">
        <h2>Recent Alerts</h2>
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              <div className="alert-header">
                <span className="candidate-name">{alert.candidateName}</span>
                <span className="time">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <span className="message">
                {alert.events.map(e => e.message).join(', ')}
              </span>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="no-alerts">No recent alerts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboard;