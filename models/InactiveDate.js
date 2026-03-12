const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  }
});

const inactiveDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  isFullDay: {
    type: Boolean,
    default: false
  },
  timeSlots: [timeSlotSchema],
  reason: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

inactiveDateSchema.index({ date: 1 }, { unique: true });

inactiveDateSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('InactiveDate', inactiveDateSchema);