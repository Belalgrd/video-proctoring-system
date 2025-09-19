// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

// Import models
const Session = require('./models/Session');
const Event = require('./models/Event');

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting - More lenient for development
const createRateLimiter = (max = 100) => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for localhost
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') {
      return true; // Skip rate limiting in development
    }
    return false;
  }
});

// Apply different rate limits to different endpoints
const strictLimiter = createRateLimiter(100);
const relaxedLimiter = createRateLimiter(1000);

// Apply rate limiting selectively
app.use('/api/auth', strictLimiter);
app.use('/api/sessions/:id/events', relaxedLimiter); // Events need more requests
app.use('/api/sessions/:id/end', relaxedLimiter);   // End session should not be limited
app.use('/api', relaxedLimiter); // Default for other routes

// Connect to MongoDB (removed deprecated options)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-proctoring')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT 
  });
});

// Create new session
app.post('/api/sessions', async (req, res) => {
  try {
    console.log('Creating new session for:', req.body.candidateName);
    const { candidateName, interviewCode, startTime } = req.body;
    
    const session = new Session({
      candidateName,
      interviewCode,
      startTime: startTime || Date.now(),
      status: 'active',
      integrityScore: 100,
      events: []
    });
    
    await session.save();
    console.log('Session created with ID:', session._id);
    
    // Notify interviewers
    io.emit('new-session', {
      id: session._id,
      candidateName: session.candidateName,
      startTime: session.startTime
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .sort({ startTime: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log events for a session
app.post('/api/sessions/:id/events', async (req, res) => {
  try {
    const { events } = req.body;
    const sessionId = req.params.id;
    console.log(`Logging ${events.length} events for session ${sessionId}`);
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      console.error('Session not found:', sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add events to session
    session.events.push(...events);
    
    // Recalculate integrity score
    session.integrityScore = calculateIntegrityScore(session.events);
    
    await session.save();
    
    // Notify interviewers in real-time
    io.emit('session-update', {
      sessionId: session._id,
      events,
      integrityScore: session.integrityScore
    });
    
    res.json(session);
  } catch (error) {
    console.error('Error logging events:', error);
    res.status(500).json({ error: error.message });
  }
});

// End session - UPDATED with better error handling
app.post('/api/sessions/:id/end', async (req, res) => {
  try {
    const sessionId = req.params.id;
    console.log(`Attempting to end session: ${sessionId}`);
    
    // Find session with error handling for invalid IDs
    let session;
    try {
      session = await Session.findById(sessionId);
    } catch (dbError) {
      console.error('Database error when finding session:', dbError);
      return res.status(400).json({ error: 'Invalid session ID format' });
    }
    
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session is already completed
    if (session.status === 'completed') {
      console.log('Session already completed:', sessionId);
      return res.json(session);
    }
    
    // Update session
    session.endTime = req.body.endTime || Date.now();
    session.status = 'completed';
    session.duration = Math.floor((session.endTime - session.startTime) / 1000); // in seconds
    
    await session.save();
    console.log(`Session ${sessionId} ended successfully. Duration: ${session.duration}s`);
    
    // Notify interviewers
    io.emit('session-ended', {
      sessionId: session._id.toString(),
      candidateName: session.candidateName,
      duration: session.duration,
      integrityScore: session.integrityScore
    });
    
    res.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to end session. Please try again.' 
    });
  }
});

// Get session report
app.get('/api/sessions/:id/report', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const report = generateReport(session);
    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate integrity score
function calculateIntegrityScore(events) {
  let score = 100;
  
  events.forEach(event => {
    switch(event.type) {
      case 'NO_FACE':
        score -= 10;
        break;
      case 'LOOKING_AWAY':
        score -= 5;
        break;
      case 'MULTIPLE_FACES':
        score -= 15;
        break;
      case 'SUSPICIOUS_OBJECT':
        score -= 20;
        break;
      case 'DROWSINESS':
        score -= 10;
        break;
      case 'BACKGROUND_NOISE':
        score -= 5;
        break;
    }
  });
  
  return Math.max(0, score);
}

// Helper function to generate report
function generateReport(session) {
  const eventSummary = {};
  
  session.events.forEach(event => {
    if (!eventSummary[event.type]) {
      eventSummary[event.type] = 0;
    }
    eventSummary[event.type]++;
  });
  
  return {
    sessionId: session._id,
    candidateName: session.candidateName,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    integrityScore: session.integrityScore,
    totalEvents: session.events.length,
    eventSummary,
    events: session.events,
    status: session.status,
    recommendation: session.integrityScore >= 70 ? 'PASS' : 'REVIEW_REQUIRED'
  };
}

// Socket.io connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('proctoring-event', (data) => {
    console.log('Proctoring event received:', data.events?.length || 0, 'events');
    // Broadcast to all interviewer dashboards
    socket.broadcast.emit('candidate-alert', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.path);
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5050; // Changed to 5050 to match your frontend
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Connected' : 'Using local'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app;