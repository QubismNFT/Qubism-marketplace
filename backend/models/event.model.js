const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  id: {type: String, index: true},
  timestamp: {type: Number, index: true},
  txhash: String,
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},
  name: String,
  from: {type: String, index: true, lowercase: true}, 
  to: {type: String, index: true, lowercase: true}, 
  price: Number,
});

eventSchema.index({ id: 1, tokenId: 1 , itemCollection: 1});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
