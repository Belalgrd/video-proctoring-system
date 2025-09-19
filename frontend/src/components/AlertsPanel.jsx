// frontend/src/components/AlertsPanel.jsx
import React from 'react';
import './AlertsPanel.css';

const AlertsPanel = ({ events }) => {
  const getAlertClass = (type) => {
    switch(type) {
      case 'MULTIPLE_FACES':
      case 'SUSPICIOUS_OBJECT':
        return 'alert-critical';
      case 'NO_FACE':
      case 'LOOKING_AWAY':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'MULTIPLE_FACES': return '👥';
      case 'SUSPICIOUS_OBJECT': return '📱';
      case 'NO_FACE': return '🚫';
      case 'LOOKING_AWAY': return '👀';
      case 'DROWSINESS': return '😴';
      case 'BACKGROUND_NOISE': return '🔊';
      default: return '⚠️';
    }
  };

  return (
    <div className="alerts-panel">
      <h3>Activity Log</h3>
      <div className="alerts-container">
        {events.length === 0 ? (
          <p className="no-alerts">No alerts yet</p>
        ) : (
          events.slice(0, 50).map((event, index) => (
            <div key={index} className={`alert-item ${getAlertClass(event.type)}`}>
              <span className="alert-icon">{getAlertIcon(event.type)}</span>
              <div className="alert-content">
                <div className="alert-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="alert-message">{event.message}</div>
                {event.duration && (
                  <div className="alert-duration">
                    Duration: {Math.round(event.duration)}s
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;