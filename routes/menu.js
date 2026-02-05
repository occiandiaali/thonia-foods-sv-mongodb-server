const express = require("express");
const Menu = require("../models/Menu");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, roleCheck(["attendant", "admin"]), async (req, res) => {
  try {
    const { name } = req.query;
    // Find the Menu doc (assuming there's one main Menu doc)
    let menuDoc = await Menu.findOne();
    if (!menuDoc) {
      return res.status(400).json({
        error: "Menu setup is missing. Admin must first configure it.",
      });
    }
    // Find the matching item
    const drinkInMenu = menuDoc.menu.find(
      (m) => m.category === "drinks" && m.name === name,
    );
    if (!drinkInMenu) {
      return res.status(400).json({
        error: "Drink not found!",
      });
    }

    res.json(drinkInMenu);
    // console.log("DrinkMenuItem", drinkInMenu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    const { name, price, category, quantity } = req.body;
    // Find the Menu doc (assuming there's one main Menu doc)
    let menuDoc = await Menu.findOne();
    if (!menuDoc) {
      menuDoc = new Menu({ menu: [] });
    }

    // Push new Menu item into Menus doc
    if (category === "drinks") {
      menuDoc.menu.push({
        name,
        price,
        category,
        quantity,
      });
    } else {
      menuDoc.menu.push({
        name,
        price,
        category,
      });
    }
    // const menuItem = new Menu(req.body);
    await menuDoc.save();
    // console.log("Menu added: ", menuDoc);
    res.json(menuDoc.menu);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
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
