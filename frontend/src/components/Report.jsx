// frontend/src/components/Report.jsx
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import this way

const Report = ({ sessionData }) => {
  // Check if sessionData exists
  if (!sessionData) {
    return (
      <div className="report-container">
        <h2>No Session Data Available</h2>
        <p>Please complete an interview session first.</p>
      </div>
    );
  }

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Proctoring Report', 14, 22);
    
    // Candidate Info
    doc.setFontSize(12);
    doc.text(`Candidate: ${sessionData.candidateName || 'Unknown'}`, 14, 40);
    doc.text(`Date: ${new Date(sessionData.startTime).toLocaleString()}`, 14, 50);
    doc.text(`Duration: ${calculateDuration(sessionData)}`, 14, 60);
    doc.text(`Integrity Score: ${sessionData.integrityScore || 0}%`, 14, 70);
    
    // Events Table
    if (sessionData.events && sessionData.events.length > 0) {
      const eventData = sessionData.events.map(event => [
        new Date(event.timestamp).toLocaleTimeString(),
        event.type,
        event.message || '-',
        event.duration ? `${Math.round(event.duration)}s` : '-'
      ]);
      
      // Use autoTable directly (not doc.autoTable)
      autoTable(doc, {
        head: [['Time', 'Event Type', 'Description', 'Duration']],
        body: eventData,
        startY: 80,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    } else {
      doc.text('No events recorded during the session.', 14, 90);
    }
    
    // Summary
    const summary = generateSummary(sessionData.events || []);
    const finalY = doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 110;
    
    doc.setFontSize(14);
    doc.text('Summary', 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Violations: ${summary.totalViolations}`, 14, finalY + 10);
    doc.text(`Focus Lost: ${summary.focusLostCount} times`, 14, finalY + 20);
    doc.text(`Suspicious Objects Detected: ${summary.suspiciousObjectsCount}`, 14, finalY + 30);
    doc.text(`Multiple Faces Detected: ${summary.multipleFacesCount} times`, 14, finalY + 40);
    
    // Recommendation
    const recommendation = (sessionData.integrityScore || 0) >= 70 ? 'PASS' : 'REVIEW REQUIRED';
    doc.setFontSize(12);
    doc.setTextColor(recommendation === 'PASS' ? 0 : 255, recommendation === 'PASS' ? 128 : 0, 0);
    doc.text(`Recommendation: ${recommendation}`, 14, finalY + 60);
    
    // Save PDF
    doc.save(`proctoring-report-${sessionData.candidateName || 'candidate'}-${Date.now()}.pdf`);
  };
  
  const calculateDuration = (session) => {
    if (session.duration) {
      const minutes = Math.floor(session.duration / 60);
      const seconds = Math.floor(session.duration % 60);
      return `${minutes}m ${seconds}s`;
    }
    
    if (session.endTime && session.startTime) {
      const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60;
      return `${Math.round(duration)} minutes`;
    }
    
    return 'N/A';
  };
  
  const generateSummary = (events) => {
  const summary = {
    totalViolations: events.length,
    focusLostCount: 0,
    suspiciousObjectsCount: 0,
    multipleFacesCount: 0,
    noFaceCount: 0,
    drowsinessCount: 0,
    backgroundNoiseCount: 0
  };
  
  events.forEach(event => {
    switch(event.type) {
      case 'LOOKING_AWAY':
        summary.focusLostCount++;
        break;
      case 'SUSPICIOUS_OBJECT':
        summary.suspiciousObjectsCount++;
        break;
      case 'MULTIPLE_FACES':
        summary.multipleFacesCount++;
        break;
      case 'NO_FACE':
        summary.noFaceCount++;
        break;
      case 'DROWSINESS':
        summary.drowsinessCount++;
        break;
      case 'BACKGROUND_NOISE':
        summary.backgroundNoiseCount++;
        break;
      default:
        // Handle any unknown event types
        console.warn('Unknown event type:', event.type);
        break;
    }
  });
  
  return summary;
};
  
  const eventCounts = generateSummary(sessionData.events || []);
  
  return (
    <div className="report-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Interview Report</h1>
      
      <div className="report-header" style={{ marginBottom: '2rem' }}>
        <h2>Candidate: {sessionData.candidateName || 'Unknown'}</h2>
        <p>Date: {new Date(sessionData.startTime).toLocaleString()}</p>
        <p>Duration: {calculateDuration(sessionData)}</p>
      </div>
      
      <div className="report-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem' 
      }}>
        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3>Integrity Score</h3>
          <p className="score" style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold',
            color: sessionData.integrityScore >= 70 ? '#27ae60' : '#e74c3c' 
          }}>
            {sessionData.integrityScore || 0}%
          </p>
        </div>
        
        <div className="stat-card" style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3>Total Alerts</h3>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3498db' }}>
            {sessionData.events?.length || 0}
          </p>
        </div>
      </div>
      
      <div className="event-breakdown" style={{ marginBottom: '2rem' }}>
        <h3>Event Breakdown</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>❌ No Face Detected: {eventCounts.noFaceCount} times</li>
          <li>👀 Looking Away: {eventCounts.focusLostCount} times</li>
          <li>📱 Suspicious Objects: {eventCounts.suspiciousObjectsCount} times</li>
          <li>👥 Multiple Faces: {eventCounts.multipleFacesCount} times</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button 
          onClick={generatePDF} 
          style={{
            padding: '1rem 2rem',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
};

export default Report;