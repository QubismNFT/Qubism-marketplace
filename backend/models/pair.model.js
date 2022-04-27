const mongoose = require('mongoose');

const pairSchema = new mongoose.Schema({
  id: {type: Number, index: true},
  timestamp: {type: Number, index: true},
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},
  creator: {type: String, lowercase: true,}, //address of the creator
  owner: {type: String, lowercase: true,},
  price: Number,
  creatorFee: Number,
  bValid: Boolean,  
});

pairSchema.index({ id: 1, tokenId: 1 , itemCollection: 1});

const Pair = mongoose.model('Pair', pairSchema);
module.exports = Pair;
