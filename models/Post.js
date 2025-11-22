const mongoose = require("mongoose");

// Comment sub-schema
const CommentSchema = new mongoose.Schema(
    {
        author: { type: String, required: true },
        text: { type: String, required: true },
    },
    { timestamps: true }
);

// Post schema
const PostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        author: { type: String, required: true, default: "Anonymous" },
        comments: [CommentSchema],
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.Post || mongoose.model("Post", PostSchema);
