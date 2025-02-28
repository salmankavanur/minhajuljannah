const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  created: { type: Date, default: Date.now },
  location: { type: String, default: 'Unknown' },
  device: { type: String, required: true },
  shared: { type: Boolean, default: false },
  posterUrl: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);