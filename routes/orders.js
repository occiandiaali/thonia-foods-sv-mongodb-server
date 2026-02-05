const express = require("express");
const Order = require("../models/Order");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, roleCheck(["admin"]), async (req, res) => {
  // const orders = await Order.find().populate("items").populate("createdBy");
  // res.json(orders);
  try {
    // const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const recentOrders = await Order.find({
      createdAt: { $gte: threeHoursAgo, $lte: now },
    });

    res.json(recentOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/", auth, roleCheck(["attendant"]), async (req, res) => {
  // const order = new Order({ ...req.body, createdBy: req.user.id });
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).send(newOrder);
    // res.json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error. Couldn't save new order." });
  }
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
