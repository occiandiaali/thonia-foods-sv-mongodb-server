const express = require("express");
const Kitchen = require("../models/Kitchen");
const Menu = require("../models/Menu");

const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

router.post("/add-container", auth, roleCheck(["admin"]), async (req, res) => {
  // console.log("Hit /add-container route");
  try {
    const { name, wgt, scoop } = req.body;

    // Find the Kitchen doc (assuming one main Kitchen doc)
    let kitchenDoc = await Kitchen.findOne();
    if (!kitchenDoc) {
      kitchenDoc = new Kitchen({ containers: [], foods: [] });
      //  return res.status(404).json({ error: "Kitchen not found" });
    }

    // Push new container into array
    kitchenDoc.containers.push({ name, wgt, scoop });

    await kitchenDoc.save();
    console.log("Container added: ", kitchenDoc);

    res.json(kitchenDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/update-container/:id",
  auth,
  roleCheck(["admin"]),
  async (req, res) => {
    try {
      const { name, wgt, scoop } = req.body;
      const { id } = req.params; // container _id

      const kitchenDoc = await Kitchen.findOne();
      if (!kitchenDoc) {
        return res.status(404).json({ error: "Kitchen not found" });
      }

      const container = kitchenDoc.containers.id(id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      // Update fields
      if (name) container.name = name;
      if (wgt) container.wgt = wgt;
      if (scoop) container.scoop = scoop;

      await kitchenDoc.save();
      res.json(kitchenDoc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

router.delete(
  "/delete-container/:id",
  auth,
  roleCheck(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const kitchenDoc = await Kitchen.findOne();
      if (!kitchenDoc) {
        return res.status(404).json({ error: "Kitchen not found" });
      }

      const container = kitchenDoc.containers.id(id);
      if (!container) {
        return res.status(404).json({ error: "Container not found" });
      }

      container.remove();
      await kitchenDoc.save();

      res.json({ message: "Container deleted", kitchen: kitchenDoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// router.post("/add-container", auth, roleCheck(["admin"]), async (req, res) => {
//   try {
//     const {name, wgt, scoop} = req.body;
//     const cooler = new Kitchen({container:{name, wgt, scoop}});
//     await cooler.save();
//     console.log("Cooler added: ", cooler);

//     res.json(cooler);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

router.get(
  "/containers",
  auth,
  roleCheck(["admin", "kitchen"]),
  async (req, res) => {
    const data = await Kitchen.find(); // all containers data readonly
  },
);
//================================
router.get("/serving", auth, async (req, res) => {
  try {
    const kitchenDoc = await Kitchen.findOne();
    if (!kitchenDoc) {
      return res
        .status(400)
        .json({ error: "Kitchen not found. Admin's attention required." });
    }

    // Sort foods by createdAt descending (latest first)
    const foods = kitchenDoc.foods.sort((a, b) => b.createdAt - a.createdAt);

    res.json(foods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/recent", auth, async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 1); // last 24h
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const kitchenDoc = await Kitchen.findOne();
    if (!kitchenDoc) {
      return res.status(400).json({ error: "Kitchen not found" });
    }

    const recentFoods = kitchenDoc.foods.filter(
      (food) => food.createdAt >= twelveHoursAgo,
    );
    const recentSnacks = kitchenDoc.snacks.filter(
      (snack) => snack.createdAt >= twelveHoursAgo,
    );
    // // const allRecents = [...recentFoods, ...recentSnacks];
    // console.log("FoodData: ", recentFoods);
    // console.log("SnackData: ", recentSnacks);
    res.json({ foodData: recentFoods, snackData: recentSnacks });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// [
//   {
//     "name": "Pasta",
//     "wgt": 50,
//     "addition": false,
//     "createdAt": "2026-01-31T16:55:12.345Z"
//   },
//   {
//     "name": "Rice",
//     "wgt": 30,
//     "addition": true,
//     "createdAt": "2026-01-31T16:58:44.789Z"
//   }
// ]

//===============================================

router.post(
  "/attendant-confirm",
  auth,
  roleCheck(["attendant"]),
  async (req, res) => {
    try {
      const { name, weight } = req.body;
      // Find the Kitchen doc (assuming there's one main Kitchen doc)
      const kitchenDoc = await Kitchen.findOne();
      if (!kitchenDoc) {
        return res.status(400).json({
          error:
            "Kitchen setup is missing. Please contact an admin to configure containers.",
        });
      }
      // Find matching container
      const container = kitchenDoc.containers.find((c) => c.name === name);
      if (!container) {
        return res.status(422).json({
          error: `No container found for '${name}'. Please ask an admin to add it before serving.`,
        });
      }
      // Calculate difference
      const foodWeight = Math.abs(container.wgt - weight);
      res.json(foodWeight);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);
//================================
router.post("/food", auth, roleCheck(["kitchen"]), async (req, res) => {
  try {
    const { name, weight, extra } = req.body;

    // Find the Kitchen doc (assuming there's one main Kitchen doc)
    const kitchenDoc = await Kitchen.findOne();

    // Find the Menu doc (assuming there's one main Menu doc)
    const menuDoc = await Menu.findOne();
    if (!menuDoc) {
      return res.status(400).json({
        error: "Menu setup is missing. Admin must first configure it.",
      });
    }
    // Find the matching item
    const itemInMenu = menuDoc.menu.find((m) => m.name === name);
    if (!itemInMenu) {
      return res.status(400).json({
        error: "This item is not in the Menu!",
      });
    }

    // if (!kitchenDoc) {
    //   return res.status(404).json({ error: "Kitchen not found" });
    // }
    if (!kitchenDoc) {
      return res.status(400).json({
        error:
          "Kitchen setup is missing. Please contact an admin to configure containers.",
      });
    }

    // Find matching container
    const container = kitchenDoc.containers.find((c) => c.name === name);
    // if (!container) {
    //   return res.status(404).json({ error: "Container not found" });
    // }
    if (!container) {
      return res.status(422).json({
        error: `No container found for '${name}'. Please ask an admin to add it before serving.`,
      });
    }

    // Calculate difference
    const finalWeight = Math.abs(container.wgt - weight);

    const quantity = finalWeight / container.scoop;
    // console.log(
    //   `Entry: ${finalWeight}, ${Math.round(quantity)}, ${itemInMenu.price}`,
    // );

    // Push new food into foods array
    kitchenDoc.foods.push({
      name,
      kitchenWgt: weight,
      wgt: finalWeight,
      qty: Math.round(quantity),
      price: itemInMenu.price,
      expectedTotal: Math.round(quantity) * itemInMenu.price,
      addition: extra,
    });
    //console.log("Pushed: ", kitchenDoc.foods);

    await kitchenDoc.save();
    // console.log("Serving ", kitchenDoc.foods);

    res.json(kitchenDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
//******************************* */
router.post("/snack", auth, roleCheck(["kitchen"]), async (req, res) => {
  try {
    const { name, count, extra } = req.body;

    // Find the Kitchen doc (assuming there's one main Kitchen doc)
    const kitchenDoc = await Kitchen.findOne();

    // Find the Menu doc (assuming there's one main Menu doc)
    const menuDoc = await Menu.findOne();
    if (!menuDoc) {
      return res.status(400).json({
        error: "Menu setup is missing. Admin must first configure it.",
      });
    }
    // Find the matching item
    const itemInMenu = menuDoc.menu.find((m) => m.name === name);
    if (!itemInMenu) {
      return res.status(400).json({
        error: "This item is not in the menu!",
      });
    }

    // if (!kitchenDoc) {
    //   return res.status(404).json({ error: "Kitchen not found" });
    // }
    if (!kitchenDoc) {
      return res.status(400).json({
        error:
          "Kitchen setup is missing. Please contact an admin to configure containers.",
      });
    }

    // Push new food into foods array
    kitchenDoc.snacks.push({
      name,
      qty: count,
      price: itemInMenu.price,
      expectedTotal: count * itemInMenu.price,
      addition: extra,
    });
    //console.log("Pushed: ", kitchenDoc.foods);

    await kitchenDoc.save();
    // console.log("Serving ", kitchenDoc.foods);

    res.json(kitchenDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update serving
router.put("/serving/:id", auth, roleCheck(["kitchen"]), async (req, res) => {
  try {
    const { name, wgt, addition } = req.body;
    const { id } = req.params; // food _id

    const kitchenDoc = await Kitchen.findOne();
    if (!kitchenDoc) {
      return res.status(404).json({ error: "Kitchen not found" });
    }

    const food = kitchenDoc.foods.id(id);
    if (!food) {
      return res.status(404).json({ error: "Food not found" });
    }

    if (name) food.name = name;
    if (wgt) food.wgt = wgt;
    if (addition !== undefined) food.addition = addition;

    await kitchenDoc.save();
    res.json(kitchenDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete serving
router.delete(
  "/serving/:id",
  auth,
  roleCheck(["kitchen"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const kitchenDoc = await Kitchen.findOne();
      if (!kitchenDoc) {
        return res.status(404).json({ error: "Kitchen not found" });
      }

      const food = kitchenDoc.foods.id(id);
      if (!food) {
        return res.status(404).json({ error: "Food not found" });
      }

      food.remove();
      await kitchenDoc.save();

      res.json({ message: "Food deleted", kitchen: kitchenDoc });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;

// BEWARE: DO NOT DELETE THE FOLLOWING, KEPT FOR REFERENCE

// router.post("/archive-foods", auth, roleCheck(["admin"]), async (req, res) => {
//   try {
//     const kitchenDoc = await Kitchen.findOne();
//     if (!kitchenDoc) {
//       return res.status(404).json({ error: "Kitchen not found" });
//     }

//     if (kitchenDoc.foods.length === 0) {
//       return res.json({ message: "No foods to archive" });
//     }

//     // Copy foods into FoodHistory
//     const archivedFoods = kitchenDoc.foods.map(food => ({
//       name: food.name,
//       wgt: food.wgt,
//       addition: food.addition,
//     }));

//     await FoodHistory.insertMany(archivedFoods);

//     // Clear foods array
//     kitchenDoc.foods = [];
//     await kitchenDoc.save();

//     res.json({ message: "Foods archived and cleared", archivedCount: archivedFoods.length });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });
// // cron job
// const cron = require("node-cron");

// // Every Sunday at midnight
// cron.schedule("0 0 * * 0", async () => { });

// // Every 24 hours at midnight
// cron.schedule("0 0 * * *", async () => {
//   try {
//     const kitchenDoc = await Kitchen.findOne();
//     if (kitchenDoc && kitchenDoc.foods.length > 0) {
//       const archivedFoods = kitchenDoc.foods.map(food => ({
//         name: food.name,
//         wgt: food.wgt,
//         addition: food.addition,
//       }));

//       await FoodHistory.insertMany(archivedFoods);

//       kitchenDoc.foods = [];
//       await kitchenDoc.save();

//       console.log(`Archived ${archivedFoods.length} foods at midnight`);
//     }
//   } catch (err) {
//     console.error("Cron job error:", err);
//   }
// });
//================

// 1. Query FoodHistory by Date Range
// You’ll often want to fetch foods archived in the last 7 days or 24 hours. With Mongoose, you can filter by archivedAt:
// router.get(
//   "/food-history",
//   auth,
//   roleCheck(["admin", "kitchen"]),
//   async (req, res) => {
//     try {
//       const { days } = req.query; // e.g. ?days=7
//       const since = new Date();
//       since.setDate(since.getDate() - (days || 7)); // default 7 days

//       const history = await FoodHistory.find({ archivedAt: { $gte: since } });

//       res.json(history);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Server error" });
//     }
//   },
// );
// Call /food-history?days=7 → returns all foods archived in the last week.

// Call /food-history?days=1 → returns foods archived in the last 24 hours.

//module.exports = router;
