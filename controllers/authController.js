const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const registerAdmin = async (req, res) => {
  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ success: false, error: 'Passcode is required' });
    }

    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: 'Admin already exists' });
    }

    const admin = new Admin({ passcode });
    await admin.save();

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({ success: false, error: 'Passcode is required' });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(401).json({ success: false, error: 'No admin found' });
    }

    const isMatch = await admin.comparePasscode(passcode);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid passcode' });
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const changePasscode = async (req, res) => {
  try {
    const { oldPasscode, newPasscode } = req.body;

    if (!oldPasscode || !newPasscode) {
      return res.status(400).json({ success: false, error: 'Old and new passcode required' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }

    const isMatch = await admin.comparePasscode(oldPasscode);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid old passcode' });
    }

    admin.passcode = newPasscode;
    await admin.save();

    res.json({ success: true, message: 'Passcode changed successfully' });
  } catch (error) {
    console.error('Change passcode error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-passcode');
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  changePasscode,
  verifyToken
};