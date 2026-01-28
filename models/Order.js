const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Menu" }],
  status: {
    type: String,
    enum: ["pending", "preparing", "completed"],
    default: "pending",
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Order", orderSchema);
