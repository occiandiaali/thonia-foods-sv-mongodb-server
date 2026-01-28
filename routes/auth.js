const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, roleCheck } = require("../middleware/auth");

const router = express.Router();

// Register (Admin only)
router.post("/register", auth, roleCheck(["admin"]), async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword, phone, role });
  await user.save();
  res.json(user);
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  res.json({ token, role: user.role });
});

// Update password (self)
router.put("/password", auth, async (req, res) => {
  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });
  res.json({ msg: "Password updated" });
});

// Delete user (Admin only)
router.delete("/:id", auth, roleCheck(["admin"]), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  //User.findOneAndDelete
  res.json({ msg: "User deleted" });
});

module.exports = router;
