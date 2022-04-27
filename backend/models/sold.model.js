const mongoose = require('mongoose');

const soldSchema = new mongoose.Schema({
  timestamp: {type: Number, index: true},
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},
  seller: {type: String, index: true, lowercase: true},  
  amount: Number // earned money
});

soldSchema.index({ timestamp: 1, seller: 1 });
const Sold = mongoose.model('Sold', soldSchema);
module.exports = Sold;
