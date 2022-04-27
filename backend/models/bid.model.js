const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  id: {type: String, index: true},
  timestamp: {type: Number, index: true},
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},
  auctionId: {type: Number, index: true},
  from: {type: String, index: true, lowercase: true,}, 
  bidPrice: Number,
});


bidSchema.index({ id: 1, itemCollection: 1 , tokenId: 1});
bidSchema.index({ id: 1, itemCollection: 1, tokenId: 1, auctionId: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
