const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {type: String, unique: true, index: true},
  name: String,
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
