const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Menu" }],
//   status: {
//     type: String,
//     enum: ["pending", "preparing", "completed"],
//     default: "pending",
//   },
//   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
// });
const orderSchema = new mongoose.Schema({
  items: [{ name: String, unit: Number, quantity: Number, subTotal: Number }],
  gTotal: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }, // useful for cleanup/export
});

module.exports = mongoose.model("Order", orderSchema);
