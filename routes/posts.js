const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");

const auth = require("../middleware/auth");            // JWT for write
const authPublic = require("../middleware/authPublic"); // SERVER_SECRET for read

// ----------------------------------------
// Helpers: extract only allowed fields
// ----------------------------------------
function extractPostFields(body) {
    const allowed = ["title", "content", "author"];
    const filtered = {};

    for (const key of allowed) {
        if (body[key] !== undefined) {
            filtered[key] = body[key];
        }
    }

    return filtered;
}

// ----------------------------------------
// READ ROUTES (require SERVER_SECRET)
// ----------------------------------------

router.get("/", authPublic, async (req, res) => {
    // ⭐ NEW SORT: newest → oldest
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
});

router.get("/search", authPublic, async (req, res) => {
    const { query } = req.query;

    const posts = await Post.find({
        title: { $regex: query, $options: "i" }
    }).sort({ createdAt: -1 }); // optional but recommended

    res.json(posts);
});

router.get("/:id", authPublic, async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Not found" });

    res.json(post);
});

// ----------------------------------------
// WRITE ROUTES (require JWT)
// ----------------------------------------

router.post("/", auth, async (req, res) => {
    const data = extractPostFields(req.body);

    // If no author provided, default to logged in user
    if (!data.author) {
        data.author = req.user.id;
    }

    const post = await Post.create(data);
    res.status(201).json(post);
});

router.put("/:id", auth, async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const updates = extractPostFields(req.body);

    const post = await Post.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
    );

    if (!post) return res.status(404).json({ error: "Not found" });

    res.json(post);
});

router.delete("/:id", auth, async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Not found" });
    }

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Not found" });

    await post.deleteOne();

    res.json({ message: "Post successfully deleted" });
});

module.exports = router;