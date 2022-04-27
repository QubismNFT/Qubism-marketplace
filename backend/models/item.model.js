const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: {type: String, index: true},
  timestamp: {type: Number, index: true},
  itemCollection: {type: String, index: true, lowercase: true},
  tokenId: {type: Number, index: true},

  creator: {type: String, lowercase: true},
  owner: {type: String, lowercase: true},
  itemOwner: {type: String, lowercase: true}, // pair, auction owner 
  royalty: Number,

  assetType: String,
  category: {type: String, index: true},
  name: { type: String, index: true },
  description: String, //item description
  mainData: String, //item data link
  coverImage: String, //cover image link 
  itemStatus: {type: Boolean, default: true },  
  likeCount: {type: Number, default: 0},
  likes: [{type: String, lowercase: true}], //addresses

  price: Number, // list price for fixed, start/lastbid price for auction  
});


itemSchema.index({ name: 1, tokenId: 1 });
const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
