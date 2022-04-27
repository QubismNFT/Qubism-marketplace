const mongoose = require('mongoose');

const itemCollectionSchema = new mongoose.Schema({
  address: {type: String, lowercase: true}, //every single collection has its own address
  owner: {type: String, lowercase: true}, //address of the owner
  name: String,
  uri: String,
  isPublic: {type: Boolean, default: false },
  timestamp: {type: Number, index: true},
});

const ItemCollection = mongoose.model('ItemCollection', itemCollectionSchema);

module.exports = ItemCollection;
