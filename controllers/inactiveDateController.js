const InactiveDate = require('../models/InactiveDate');

const createOrUpdateInactiveDate = async (req, res) => {
  try {
    const { date, isFullDay, timeSlots, reason } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const dateString = date.includes('T') ? date.split('T')[0] : date;
    const targetDate = new Date(`${dateString}T00:00:00.000Z`);

    const existingRecord = await InactiveDate.findOne({ date: targetDate });

    if (existingRecord) {
      existingRecord.isFullDay = isFullDay;
      existingRecord.timeSlots = timeSlots || [];
      existingRecord.reason = reason || '';
      existingRecord.updatedAt = Date.now();
      await existingRecord.save();
      
      return res.json({
        success: true,
        message: 'Inactive date updated successfully',
        data: existingRecord
      });
    }

    const inactiveDate = new InactiveDate({
      date: targetDate,
      isFullDay,
      timeSlots: timeSlots || [],
      reason: reason || '',
      createdBy: req.adminId
    });

    await inactiveDate.save();

    res.status(201).json({
      success: true,
      message: 'Inactive date created successfully',
      data: inactiveDate
    });
  } catch (error) {
    console.error('Create/Update inactive date error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getAllInactiveDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const inactiveDates = await InactiveDate.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'createdAt');

    res.json({
      success: true,
      count: inactiveDates.length,
      data: inactiveDates
    });
  } catch (error) {
    console.error('Get inactive dates error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const getInactiveDateByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    const dateString = date.includes('T') ? date.split('T')[0] : date;
    const targetDate = new Date(`${dateString}T00:00:00.000Z`);

    const inactiveDate = await InactiveDate.findOne({ date: targetDate });

    if (!inactiveDate) {
      return res.status(404).json({ 
        success: false, 
        error: 'No inactive settings found for this date' 
      });
    }

    res.json({
      success: true,
      data: inactiveDate
    });
  } catch (error) {
    console.error('Get inactive date error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const deleteInactiveDate = async (req, res) => {
  try {
    const { id } = req.params;

    const inactiveDate = await InactiveDate.findByIdAndDelete(id);

    if (!inactiveDate) {
      return res.status(404).json({ 
        success: false, 
        error: 'Inactive date not found' 
      });
    }

    res.json({
      success: true,
      message: 'Inactive date deleted successfully'
    });
  } catch (error) {
    console.error('Delete inactive date error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

const checkDateAvailability = async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const dateString = date.includes('T') ? date.split('T')[0] : date;
    const targetDate = new Date(`${dateString}T00:00:00.000Z`);

    const inactiveDate = await InactiveDate.findOne({ date: targetDate });

    if (!inactiveDate) {
      return res.json({
        success: true,
        available: true,
        message: 'Date is available'
      });
    }

    if (inactiveDate.isFullDay) {
      return res.json({
        success: true,
        available: false,
        message: 'Date is fully blocked',
        reason: inactiveDate.reason
      });
    }

    if (time && inactiveDate.timeSlots.length > 0) {
      const isTimeBlocked = inactiveDate.timeSlots.some(slot => {
        return time >= slot.start && time <= slot.end;
      });

      if (isTimeBlocked) {
        return res.json({
          success: true,
          available: false,
          message: 'Time slot is blocked',
          blockedTimeSlots: inactiveDate.timeSlots
        });
      }
    }

    res.json({
      success: true,
      available: true,
      message: 'Date and time are available',
      blockedTimeSlots: inactiveDate.timeSlots
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  createOrUpdateInactiveDate,
  getAllInactiveDates,
  getInactiveDateByDate,
  deleteInactiveDate,
  checkDateAvailability
};