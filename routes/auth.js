const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  changePasscode,
  verifyToken
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.put('/change-passcode', authMiddleware, changePasscode);
router.get('/verify', authMiddleware, verifyToken);

module.exports = router;