const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const requireAuth = require("../middleware/authPosts");

// Protect all /posts routes
router.use(requireAuth);

// GET all posts
router.get("/", async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

// SEARCH posts
router.get("/search", async (req, res) => {
    const { query } = req.query;

    const posts = await Post.find({
        title: { $regex: query, $options: "i" }
    });

    res.json(posts);
});

// GET /posts/:id
router.get("/:id", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });

    res.json(post);
});

// CREATE
router.post("/", async (req, res) => {
    const post = await Post.create(req.body);
    res.status(201).json(post);
});

// UPDATE
router.put("/:id", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const post = await Post.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!post) return res.status(404).json({ error: "Not found" });

    res.json(post);
});

// DELETE
router.delete("/:id", async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });

    res.json({ message: "Post successfully deleted" });
});

module.exports = router;
