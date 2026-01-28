const express = require("express");
const Menu = require("../models/Menu");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const menu = await Menu.find();
  res.json(menu);
});

router.post("/", auth, async (req, res) => {
  const menuItem = new Menu(req.body);
  await menuItem.save();
  res.json(menuItem);
});

router.put("/:id", auth, async (req, res) => {
  const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

router.delete("/:id", auth, async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ msg: "Menu item deleted" });
});

module.exports = router;
