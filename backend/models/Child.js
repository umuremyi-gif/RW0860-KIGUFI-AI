const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  childCustomId: { type: String, required: true, unique: true, trim: true }, // Urugero: RW0860-001
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  school: { type: String },
  className: { type: String },
  
  // Umubyeyi n'abakozi bashinzwe umwana (Role-Gated Assignments)
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedPSD: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedCounselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Abantu batabarwaho mu bihe by'ibyago cyangwa amakuru y'ihutirwa
  emergencyContacts: [{
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true }
  }],
  
  createdDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Child', ChildSchema);