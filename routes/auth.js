const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const SERVER_SECRET = process.env.SERVER_SECRET || "default-server-secret";

// ===============================
// REGISTER
// ===============================
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        // Check if user already exists
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = new User({ username, password });
        await newUser.save();

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });

    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Internal server error" });
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
            { id: user._id, username: user.username },
            SERVER_SECRET,
            { expiresIn: "1h" }        // <-- JWT expiration added here
        );

        return res.json({ token });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;