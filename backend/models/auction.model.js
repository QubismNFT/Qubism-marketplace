const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  id: {type: Number, index: true},
  timestamp: {type: Number, index: true},
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},
  startTime: {type: Number, index: true},
  endTime: {type: Number, index: true},
  startPrice: {type: Number, index: true},
  creator: {type: String, lowercase: true,}, 
  owner: {type: String, lowercase: true,},
  active: {type: Boolean, default: true },
});


auctionSchema.index({ id: 1, tokenId: 1 , itemCollection: 1});

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
