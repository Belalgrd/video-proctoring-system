// frontend/src/components/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = ({ onRoleSelect }) => {
  const [candidateName, setCandidateName] = useState('');
  const [interviewCode, setInterviewCode] = useState('');
  const navigate = useNavigate();

  const handleCandidateStart = () => {
    if (!candidateName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    // Store candidate info in session storage
    sessionStorage.setItem('candidateName', candidateName);
    sessionStorage.setItem('interviewCode', interviewCode);
    
    onRoleSelect('candidate');
    navigate('/candidate');
  };

  const handleInterviewerAccess = () => {
    onRoleSelect('interviewer');
    navigate('/interviewer');
  };

  return (
    <div className="landing-page">
      <div className="container">
        <h1>Video Proctoring System</h1>
        <p>AI-Powered Interview Integrity Platform</p>
        
        <div className="role-selection">
          <div className="role-card">
            <h2>Join as Candidate</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCandidateStart(); }}>
              <input
                type="text"
                placeholder="Enter your full name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Interview Code (optional)"
                value={interviewCode}
                onChange={(e) => setInterviewCode(e.target.value)}
              />
              <button type="submit" className="start-btn">
                Start Interview
              </button>
            </form>
          </div>
          
          <div className="role-card">
            <h2>Interviewer Dashboard</h2>
            <p>Monitor ongoing interviews and view reports</p>
            <button onClick={handleInterviewerAccess} className="access-btn">
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;