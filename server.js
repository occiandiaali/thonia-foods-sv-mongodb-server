require("dotenv").config({ path: "./.env.local" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Atlas connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Atlas MongoDB connected.."))
  .catch((err) => console.error(err));

// Routes
const authRoutes = require("./routes/auth");
const kitchenRoutes = require("./routes/kitchen");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");

app.use("/api/auth", authRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Local server running on port ${PORT}..`));
