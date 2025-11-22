const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const authPublic = require("../middleware/authPublic");

// -----------------------------------------
// GET ALL COMMENTS FOR A POST (public)
// -----------------------------------------
router.get("/:postId/comments", async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).select("comments");
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        res.json(post.comments);
    } catch (err) {
        console.error("Get comments error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// -----------------------------------------
// CREATE COMMENT (public but requires SERVER_SECRET)
// -----------------------------------------
router.post("/:postId/comments", authPublic, async (req, res) => {
    try {
        const { text, username } = req.body;
        const postId = req.params.postId;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = {
            author: username || "Anonymous",
            text,
        };

        post.comments.push(comment);
        await post.save();

        const savedComment = post.comments[post.comments.length - 1];

        res.status(201).json(savedComment);
    } catch (err) {
        console.error("Create comment error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;