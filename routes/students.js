// routes/students.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = require("../models/User");
const auth = require("../middleware/auth");
const teacherOnly = require("../middleware/teacherOnly");

// ----------------------------------------
// GET /students
// Only authenticated teachers can list students
// ----------------------------------------
router.get("/", auth, teacherOnly, async (req, res) => {
    try {
        const students = await User.find({ type: "student" })
            .select("_id username name type")
            .sort({ username: 1 });

        return res.json(students);
    } catch (err) {
        console.error("GET /students error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ----------------------------------------
// POST /students
// Create a new student (teacher-only)
// Required: name, username, password
// type is enforced as "student"
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

        const student = new User({
            name,
            username,
            password,         // IMPORTANT: let User pre('save') hook hash it
            type: "student"   // enforced
        });

        await student.save();

        return res.status(201).json({
            message: "Student created successfully",
            student: {
                id: student._id,
                name: student.name,
                username: student.username,
                type: student.type
            }
        });
    } catch (err) {
        console.error("POST /students error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// ----------------------------------------
// PUT /students/:id
// Update a student's name (teacher-only)
// Only "name" can be changed
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

        const updated = await User.findOneAndUpdate(
            { _id: id, type: "student" },
            { name },
            { new: true, runValidators: true }
        ).select("_id username name type");

        if (!updated) {
            return res.status(404).json({ error: "Not found" });
        }

        return res.json({
            message: "Student updated successfully",
            student: updated
        });
    } catch (err) {
        console.error("PUT /students/:id error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
