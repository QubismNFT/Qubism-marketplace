const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {type: String, index: true},
  timestamp: {type: Number, index: true},
  name: String,
  email: String,
  subject: String,
  message: String,  
});

messageSchema.index({ id: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
