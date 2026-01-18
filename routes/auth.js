const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Use proper JWT_SECRET naming
const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";

// ===============================
// REGISTER
// ===============================
router.post("/register", async (req, res) => {
    try {
        const { username, password, name, type } = req.body;

        if (!username || !password || !name || !type) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!["teacher", "student"].includes(type)) {
            return res.status(400).json({ message: "Invalid user type" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password,
            name,
            type
        });

        await user.save();

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                type: user.type
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ===============================
// LOGIN
// ===============================
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate inputs
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Create JWT (EXPIRES IN 1 HOUR)
        const token = jwt.sign(
            {
                id: user._id,
                type: user.type
            },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            token,
            username: user.username,
            type: user.type
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;