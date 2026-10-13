const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  role: { type: String, required: true },
  action: { type: String, required: true }, // Urugero: 'LOGIN_SUCCESS', 'HEALTH_RECORD_UPDATE'
  module: { type: String, required: true }, // Urugero: 'AUTH', 'HEALTH', 'COUNSELING'
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'DENIED'], required: true },
  ipAddress: { type: String },
  deviceInfo: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);