const express = require("express");
const Menu = require("../models/Menu");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

// Get entire menu
router.get("/all", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    const menu = await Menu.find({});
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

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
    if (category === "drinks" || category === "snacks") {
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
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/edit-item", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    //     const updated = await Menu.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    // });
    const { name, price, category, quantity } = req.body;
    // console.log("Name from req.body ", name);
    // Find the Menu doc (assuming there's one main Menu doc)
    const menuDoc = await Menu.findOne();
    // Find the matching item
    const itemInMenu = menuDoc.menu.find((m) => m.name === name);

    // Apply updates
    if (price !== undefined) itemInMenu.price = price;
    if (category !== undefined) itemInMenu.category = category;
    if (quantity !== undefined) itemInMenu.quantity = quantity;
    await menuDoc.save();
    res.json(menuDoc);

    // if (!updatedItem) {
    //   return res.status(404).json({ message: "Item not found" });
    // }

    // if (result.modifiedCount > 0) {
    //   res.status(200).send("Item updated successfully");
    // } else {
    //   res.status(404).send("Item not found");
    // }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, roleCheck(["admin"]), async (req, res) => {
  await Menu.findByIdAndDelete(req.params.id);
  res.json({ msg: "Menu item deleted" });
});

router.put(
  "/update-drink-quantity",
  auth,
  roleCheck(["admin", "attendant"]),
  async (req, res) => {
    try {
      const { name, quantity } = req.body;
     // console.log("name, quantity", name, quantity);
      // Find the Menu doc (assuming there's one main Menu doc)
      let menuDoc = await Menu.findOne();
      if (menuDoc) {
        // Find the matching item
        const drinkInMenu = menuDoc.menu.find(
          (m) => m.category === "drinks" && m.name === name,
        );
        if (quantity !== undefined) {
          drinkInMenu.quantity = quantity;
        }
        await menuDoc.save();
        res.json(`Updated ${drinkInMenu.name} quantity in Menu.`);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
