const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, required: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'Administrator', 
      'PD', 
      'PSD', 
      'Teacher', 
      'Nurse', 
      'Counselor', 
      'Parent', 
      'Child', 
      'Volunteer'
    ],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending Verification', 'Active', 'Inactive', 'Suspended', 'Disabled', 'Deleted'],
    default: 'Pending Verification' 
  },
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);