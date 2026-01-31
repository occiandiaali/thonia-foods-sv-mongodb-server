const mongoose = require("mongoose");

const foodHistorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  wgt: { type: Number, required: true },
  addition: { type: Boolean, default: false },
  archivedAt: { type: Date, default: Date.now }, // timestamp of export
});

module.exports = mongoose.model("FoodHistory", foodHistorySchema);
