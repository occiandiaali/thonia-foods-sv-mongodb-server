const express = require("express");
const Order = require("../models/Order");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const orders = await Order.find().populate("items").populate("createdBy");
  res.json(orders);
});

router.post("/", auth, async (req, res) => {
  const order = new Order({ ...req.body, createdBy: req.user.id });
  await order.save();
  res.json(order);
});

router.put("/:id", auth, async (req, res) => {
  const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.delete("/:id", auth, async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ msg: "Order deleted" });
});

module.exports = router;
