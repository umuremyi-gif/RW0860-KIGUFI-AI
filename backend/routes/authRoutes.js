const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ihuza na User Schema twabonye mbere
const AuditLog = require('../models/AuditLog'); // Ihuza na Audit Logs

// 1. REGISTRATION ENDPOINT (Kwiyandikisha)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, role, password, confirmPassword } = req.body;

    // Gukora validation y'ibanze
    if (!fullName || !phone || !role || !password) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords Do Not Match." });
    }

    // Reba niba nimero ya telefone cyangwa email byaranditsemo mbere
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "Phone Number or Email Already Registered." });
    }

    // Gucunga Password Hashing (Security policy: bcrypt)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Gutegura 6-digit OTP yo kwemeza telefone (Expires in 5 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Kurema User mushya (Status: Pending Verification)
    const newUser = new User({
      fullName,
      email,
      phone,
      passwordHash,
      role,
      status: 'Pending Verification',
      otpCode,
      otpExpiresAt
    });

    await newUser.save();

    // Kubika Audit Log
    await AuditLog.create({
      userId: newUser._id,
      role: newUser.role,
      action: 'USER_REGISTERED',
      module: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent']
    });

    // Muri gahunda nyayo, hano wohereza OTP kuri SMS. Ubu tuyigaragaje muri response kugira ngo uyibone vuba.
    res.status(201).json({
      message: "Account Created Successfully. Please verify your phone number with the OTP sent.",
      debugOtp: otpCode // Ijyaho by'igihe gito cyo kugenzura (testing)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
});


// 2. PHONE OTP VERIFICATION ENDPOINT
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otpCode } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Reba niba OTP yararenze igihe cyayo cy'iminota 5
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "Verification Code Expired. Request a new code." });
    }

    // Reba niba OTP ihuje
    if (user.otpCode !== otpCode) {
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    // Hindura status ya account iba 'Active'
    user.status = 'Active';
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Audit Log
    await AuditLog.create({
      userId: user._id,
      role: user.role,
      action: 'OTP_VERIFIED',
      module: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip
    });

    res.status(200).json({ message: "Phone Verified Successfully. Welcome to RW0860 KIGUFI AI." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
});


// 3. LOGIN ENDPOINT
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier ishobora kuba Email cyangwa Phone

    // Shaka user ukoresheje email cyangwa phone
    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    // Reba niba account ari 'Active' (Amabwiriza ya Part 2 & 3A)
    if (user.status !== 'Active') {
      return res.status(403).json({ error: "Access Denied. Account is not active or pending verification." });
    }

    // Kugenzura password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid Email or Password." });
    }

    // Gutegura JWT Token y'icyicaro (Session Token)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'RW0860_SUPER_SECRET_KEY_2026',
      { expiresIn: '8h' }
    );

    // Audit Log
    await AuditLog.create({
      userId: user._id,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent']
    });

    res.status(200).json({
      message: "Login Successful.",
      token,
      role: user.role,
      fullName: user.fullName
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
});

module.exports = router;