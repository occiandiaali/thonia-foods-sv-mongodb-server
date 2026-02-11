const express = require("express");
const Order = require("../models/Order");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

router.get("/daily-sales", auth, roleCheck(["admin"]), async (req, res) => {
  try {
    const now = new Date();

    // Build start of window: today at 7:00 AM
    const start = new Date(now);
    start.setHours(7, 0, 0, 0);

    // Build end of window: today at 10:00 PM
    const end = new Date(now);
    end.setHours(22, 0, 0, 0);

    const dailyOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    });

    res.json(dailyOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /search-daily?date=2026-02-11
router.get("/search-daily", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "Please provide a date in YYYY-MM-DD format" });
    }

    // Parse the date string into a Date object
    const targetDate = new Date(date);

    // Build start of window: 7:00 AM on that date
    const start = new Date(targetDate);
    start.setHours(7, 0, 0, 0);

    // Build end of window: 10:00 PM on that date
    const end = new Date(targetDate);
    end.setHours(22, 0, 0, 0);

    const dailyOrders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    });

    res.json(dailyOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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

router.get("/weekly-sales", async (req, res) => {
  try {
    const now = new Date();

    // Find Monday of the current week
    const monday = new Date(now);
    const day = monday.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
    monday.setDate(monday.getDate() + diff);
    monday.setHours(7, 0, 0, 0);

    // Saturday 10 PM
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Monday + 5 days = Saturday
    saturday.setHours(22, 0, 0, 0);

    const weeklySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monday, $lte: saturday },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
        },
      },
    ]);

    res.json(weeklySales[0] || { totalSales: 0, orders: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//==============================
router.get("/weekly-sales-by-day", async (req, res) => {
  try {
    const now = new Date();

    // Find Monday of the current week
    const monday = new Date(now);
    const day = monday.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
    monday.setDate(monday.getDate() + diff);
    monday.setHours(7, 0, 0, 0);

    // Saturday 10 PM
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Monday + 5 days = Saturday
    saturday.setHours(22, 0, 0, 0);

    const weeklySalesByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monday, $lte: saturday },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalSales: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { "_id.day": 1 }, // sort by day ascending
      },
    ]);

    res.json(weeklySalesByDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// What this does
// $match restricts to the current week (Mon 7 AM – Sat 10 PM).

// $group uses $dateToString to normalize createdAt into a YYYY-MM-DD string, so all orders from the same day are grouped together.

// totalSales is summed per day.

// orders keeps the raw documents if you want to drill down.

// $sort ensures the days come out in chronological order.

// Example output
// [
//   {
//     "_id": { "day": "2026-02-09" },
//     "totalSales": 15000,
//     "orders": [ ... ]
//   },
//   {
//     "_id": { "day": "2026-02-10" },
//     "totalSales": 18200,
//     "orders": [ ... ]
//   },
//   ...
// ]
// GET /weekly-sales-by-day?week=2026-02-09
router.get("/weekly-sales-by-day", async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) {
      return res
        .status(400)
        .json({
          error:
            "Please provide a week start date (Monday) in YYYY-MM-DD format",
        });
    }

    // Parse the provided week start date
    const monday = new Date(week);
    monday.setHours(7, 0, 0, 0);

    // Saturday 10 PM of that week
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Monday + 5 days = Saturday
    saturday.setHours(22, 0, 0, 0);

    const weeklySalesByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: monday, $lte: saturday },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          totalSales: { $sum: "$total" },
          orders: { $push: "$$ROOT" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    res.json(weeklySalesByDay);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// How it works
// Admin calls /weekly-sales-by-day?week=2026-02-09.

// The server treats 2026-02-09 as the Monday of that week.

// Builds the window from Monday 7 AM to Saturday 10 PM.

// Groups orders by day (YYYY-MM-DD) and sums total for each.

// Returns an array of day‑by‑day totals plus the orders.
// This structure is ideal for feeding into chart libraries like Chart.js or D3 —
// you can map day to the x‑axis and totalSales to the y‑axis.
//Example response
// [
//   { "_id": { "day": "2026-02-09" }, "totalSales": 15000, "orders": [ ... ] },
//   { "_id": { "day": "2026-02-10" }, "totalSales": 18200, "orders": [ ... ] },
//   { "_id": { "day": "2026-02-11" }, "totalSales": 9400, "orders": [ ... ] }
// ]

//=============================

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
