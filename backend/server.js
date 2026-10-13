const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ==========================================
// 1. Middlewares (CORS na Limits za Base64 Photos)
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// 2. Guhuza na Database (MongoDB Atlas)
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Successfully connected to RW0860 KIGUFI DB (MongoDB Online)');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// ==========================================
// 3. Database Schemas & Models
// ==========================================

// User Schema (Authentication)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Child Schema (Development & Profile Tracking)
const childSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  studentClass: { type: String, required: true },
  photoUrl: { type: String },
  age: { type: Number, required: true },
  weight: { type: Number, required: true },
  developmentNotes: { type: String },
}, { timestamps: true });

const Child = mongoose.model('Child', childSchema);

// ==========================================
// 4. Routes: User Authentication
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Uyu mukoresha afite konti isanzweho!' });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Wiyandikishije neza cyane!' });
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye kuri server: ' + err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Email cyangwa ijambo ry\'ibanga si byo!' });
    }

    res.status(200).json({
      message: 'Winjiye neza cyane!',
      token: 'RW0860_FAKE_JWT_TOKEN_2026',
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye kuri server: ' + err.message });
  }
});

// ==========================================
// 5. Routes: Children CRUD Operations
// ==========================================

// Create: Kubika Umwana Mushya
app.post('/api/children', async (req, res) => {
  try {
    const { userId, fullName, studentClass, photoUrl, age, weight, developmentNotes } = req.body;
    
    const newChild = new Child({ 
      userId, 
      fullName, 
      studentClass, 
      photoUrl, 
      age, 
      weight, 
      developmentNotes 
    });

    await newChild.save();
    res.status(201).json({ message: 'Amakuru y\'umwana yabitswe neza!', child: newChild });
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye: ' + err.message });
  }
});

// Read: Gusoma Urutonde rw'Abana ba User
app.get('/api/children/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const children = await Child.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(children);
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye: ' + err.message });
  }
});

// Update: Gukosora/Vugurura Amakuru y'Umwana
app.put('/api/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, studentClass, photoUrl, age, weight, developmentNotes } = req.body;

    const updatedChild = await Child.findByIdAndUpdate(
      id,
      { fullName, studentClass, photoUrl, age, weight, developmentNotes },
      { new: true }
    );

    res.status(200).json({ message: 'Amakuru y\'umwana yavuguruwe neza!', child: updatedChild });
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye mu gukosora: ' + err.message });
  }
});

// Delete: Gusiba Umwana
app.delete('/api/children/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Child.findByIdAndDelete(id);
    res.status(200).json({ message: 'Amakuru y\'umwana yasibwe neza!' });
  } catch (err) {
    res.status(500).json({ message: 'Hari ikibazo cyabaye mu gusiba: ' + err.message });
  }
});

// ==========================================
// 6. Gutangiza Server
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 RW0860 KIGUFI AI Server is running on port ${PORT}`);
});