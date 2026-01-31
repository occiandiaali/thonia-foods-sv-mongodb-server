// seedAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("supersecurepassword", 10);

  const admin = new User({
    username: "admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin",
  });

  await admin.save();
  console.log("Admin user created");
  mongoose.disconnect();
}

createAdmin();
