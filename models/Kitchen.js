const mongoose = require("mongoose");

// const kitchenSchema = new mongoose.Schema({
//   container: {
//     name: { type: String },
//     wgt: { type: Number },
//     scoop: { type: Number },
//   },
//   foodStuff: String,
//   food: {
//     name: { type: String },
//     wgt: { type: Number },
//     addition: { type: Boolean },
//   },
// });

// module.exports = mongoose.model("Kitchen", kitchenSchema);
const containerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wgt: { type: Number, required: true },
  scoop: { type: Number, required: true },
});

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kitchenWgt: { type: Number, required: true },
  wgt: { type: Number, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  expectedTotal: { type: Number, required: true },
  addition: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const snackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  expectedTotal: { type: Number, required: true },
  addition: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const kitchenSchema = new mongoose.Schema({
  containers: [containerSchema], // array of containers
  foods: [foodSchema], // array of foods
  snacks: [snackSchema], // array of snacks
  createdAt: { type: Date, default: Date.now }, // useful for cleanup/export
});

module.exports = mongoose.model("Kitchen", kitchenSchema);
