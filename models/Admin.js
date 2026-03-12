const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  passcode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

adminSchema.pre('save', async function() {
  if (!this.isModified('passcode')) return;
  const salt = await bcrypt.genSalt(10);
  this.passcode = await bcrypt.hash(this.passcode, salt);
});

adminSchema.methods.comparePasscode = async function(passcode) {
  return await bcrypt.compare(passcode, this.passcode);
};

module.exports = mongoose.model('Admin', adminSchema);