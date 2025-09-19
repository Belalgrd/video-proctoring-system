// backend/scripts/seed.js
const mongoose = require('mongoose');
const Session = require('../models/Session');
require('dotenv').config();

const sampleEvents = [
  { type: 'LOOKING_AWAY', message: 'User looking away', duration: 6 },
  { type: 'NO_FACE', message: 'No face detected', duration: 12 },
  { type: 'SUSPICIOUS_OBJECT', message: 'Phone detected', object: 'cell phone', confidence: 0.85 },
  { type: 'MULTIPLE_FACES', message: 'Multiple faces detected' },
  { type: 'DROWSINESS', message: 'Possible drowsiness detected' },
  { type: 'BACKGROUND_NOISE', message: 'Background voices detected' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-proctoring');
    
    // Clear existing data
    await Session.deleteMany({});
    
    // Create sample sessions
    const sessions = [];
    
    for (let i = 0; i < 10; i++) {
      const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const duration = 1800 + Math.random() * 1800; // 30-60 minutes
      
      const sessionEvents = [];
      const numEvents = Math.floor(Math.random() * 10);
      
      for (let j = 0; j < numEvents; j++) {
        const event = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
        sessionEvents.push({
          ...event,
          timestamp: new Date(startTime.getTime() + Math.random() * duration * 1000)
        });
      }
      
      const integrityScore = Math.max(0, 100 - sessionEvents.length * 10);
      
      sessions.push({
        candidateName: `Test Candidate ${i + 1}`,
        startTime,
        endTime: new Date(startTime.getTime() + duration * 1000),
        duration,
        events: sessionEvents,
        integrityScore,
        status: 'completed'
      });
    }
    
    await Session.insertMany(sessions);
    console.log(`Seeded ${sessions.length} sessions`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();