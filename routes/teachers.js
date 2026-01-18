// routes/teachers.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");
const teacherOnly = require("../middleware/teacherOnly");

/**
 * GET /teachers
 * Only authenticated teachers can list teacher users.
 */
router.get("/", auth, teacherOnly, async (req, res) => {
    try {
        const teachers = await User.find({ type: "teacher" })
            .select("_id username name type")
            .sort({ username: 1 });

        return res.json(teachers);
    } catch (err) {
        console.error("GET /teachers error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

const bcrypt = require("bcryptjs");

// ----------------------------------------
// POST /teachers
// Create a new teacher (teacher-only)
// ----------------------------------------
router.post("/", auth, teacherOnly, async (req, res) => {
    try {
        const { name, username, password } = req.body;

        if (!name || !username || !password) {
            return res.status(400).json({
                error: "name, username and password are required"
            });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({
                error: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const teacher = new User({
            name,
            username,
            password,
            type: "teacher" // enforced
        });

        await teacher.save();

        res.status(201).json({
            message: "Teacher created successfully",
            teacher: {
                id: teacher._id,
                name: teacher.name,
                username: teacher.username,
                type: teacher.type
            }
        });

    } catch (err) {
        console.error("Create teacher error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ----------------------------------------
// PUT /teachers/:id
// Update a teacher's name (teacher-only)
// ----------------------------------------

router.put("/:id", auth, teacherOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "Not found" });
        }

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }

        // Only allow updating teachers
        const updated = await User.findOneAndUpdate(
            { _id: id, type: "teacher" },
            { name },
            { new: true, runValidators: true }
        ).select("_id username name type");

        if (!updated) {
            return res.status(404).json({ error: "Not found" });
        }

        return res.json({
            message: "Teacher updated successfully",
            teacher: updated
        });
    } catch (err) {
        console.error("Update teacher error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;