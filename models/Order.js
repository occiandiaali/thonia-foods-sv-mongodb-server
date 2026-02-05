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
const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    attendant: String,
    items: [{ name: String, quantity: Number, subTotal: Number }],
    total: { type: Number, default: 0 },
    paidBy: String, // 'Cash', 'Transfer', or 'Card'
    // createdAt: { type: Date, default: Date.now }, // useful for cleanup/export
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
