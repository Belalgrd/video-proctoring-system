// frontend/src/App.js (update this part)
import React, { useState } from 'react';
import './App.css';
import ProctorDashboard from './components/ProctorDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import LandingPage from './components/LandingPage';
import Report from './components/Report';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  const handleSessionEnd = (data) => {
    console.log('Session ended with data:', data);
    setSessionData(data);
  };

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route 
            path="/" 
            element={<LandingPage onRoleSelect={setUserRole} />} 
          />
          <Route 
            path="/candidate" 
            element={
              userRole === 'candidate' ? 
              <ProctorDashboard onSessionEnd={handleSessionEnd} /> : 
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/interviewer" 
            element={
              userRole === 'interviewer' ? 
              <InterviewerDashboard /> : 
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/report" 
            element={<Report sessionData={sessionData} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;