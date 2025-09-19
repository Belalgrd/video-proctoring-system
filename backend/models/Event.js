// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['NO_FACE', 'LOOKING_AWAY', 'MULTIPLE_FACES', 'SUSPICIOUS_OBJECT', 'DROWSINESS', 'BACKGROUND_NOISE']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: Number,
  object: String,
  confidence: Number,
  message: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
});

module.exports = mongoose.model('Event', eventSchema);