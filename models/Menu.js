const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  quantity: Number,
});
const menuSchema = new mongoose.Schema({
  menu: [menuItemSchema],
  createdAt: { type: Date, default: Date.now }, // useful for cleanup/export
});

module.exports = mongoose.model("Menu", menuSchema);
