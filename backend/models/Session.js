// backend/models/Session.js (complete version)
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['NO_FACE', 'LOOKING_AWAY', 'MULTIPLE_FACES', 'SUSPICIOUS_OBJECT', 'DROWSINESS', 'BACKGROUND_NOISE']
  },
  timestamp: {
    type: Date,
    required: true
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
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
    trim: true
  },
  interviewCode: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in seconds
  events: [eventSchema],
  integrityScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active'
  },
  videoRecordingUrl: String,
  notes: String,
  flaggedForReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ candidateName: 1 });
sessionSchema.index({ startTime: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ integrityScore: 1 });

// Virtual for formatted duration
sessionSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return 'N/A';
  const minutes = Math.floor(this.duration / 60);
  const seconds = Math.floor(this.duration % 60);
  return `${minutes}m ${seconds}s`;
});

// Method to check if session needs review
sessionSchema.methods.needsReview = function() {
  return this.integrityScore < 70 || this.events.some(e => e.severity === 'critical');
};

// Static method to get active sessions
sessionSchema.statics.getActiveSessions = function() {
  return this.find({ status: 'active' }).sort({ startTime: -1 });
};

module.exports = mongoose.model('Session', sessionSchema);