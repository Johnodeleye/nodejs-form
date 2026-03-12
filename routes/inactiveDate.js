const express = require('express');
const router = express.Router();
const {
  createOrUpdateInactiveDate,
  getAllInactiveDates,
  getInactiveDateByDate,
  deleteInactiveDate,
  checkDateAvailability
} = require('../controllers/inactiveDateController');
const authMiddleware = require('../middleware/auth');

router.post('/dates', authMiddleware, createOrUpdateInactiveDate);
router.get('/dates', getAllInactiveDates);
router.get('/dates/check', checkDateAvailability);
router.get('/dates/:date', getInactiveDateByDate);
router.delete('/dates/:id', authMiddleware, deleteInactiveDate);

module.exports = router;