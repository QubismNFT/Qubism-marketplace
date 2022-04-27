const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: {type: String, lowercase: true}, //user address
  nonce: { type: Number, defuault: Math.floor(Math.random() * 1000000) },
  name: String,
  role: String,
  bio: String,
  profilePic: String,
  coverImg: String,
  isApproved: {type: Boolean, default: false },
  last_login: { type: Date },
  email: String, // for receive news
});

userSchema.index({ address: 1 }, { unique: true });
const User = mongoose.model('User', userSchema);

module.exports = User;
