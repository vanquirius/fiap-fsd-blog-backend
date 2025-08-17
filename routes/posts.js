// routes/posts.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- Auth Middleware ---
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7);
    if (token !== process.env.SERVER_SECRET) {
        return res.status(403).json({ error: 'Invalid token' });
    }

    next();
}

// --- Post Schema ---
const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
const mongoUri = process.env.MONGO_URI;

if (process.env.NODE_ENV !== 'test' && !mongoose.connection.readyState) {
    mongoose.connect(mongoUri)
        .then(() => console.log('MongoDB connected via posts.js'))
        .catch(err => {
            console.error('MongoDB connection failed:', err);
            process.exit(1);
        });
}

// --- Minimal test route (no auth) ---
/**
 * @swagger
 * /posts/test:
 *   get:
 *     summary: Test database connection
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Database connection successful
 *       500:
 *         description: Database connection failed
 */
router.get('/test', async (req, res) => {
    try {
        const tempConn = await mongoose.createConnection(mongoUri).asPromise();
        await tempConn.close();
        res.json({ message: 'Database connection successful!' });
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
});

// --- Protected Routes ---
router.use(authMiddleware);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: List all posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get('/', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

/**
 * @swagger
 * /posts/search:
 *   get:
 *     summary: Search posts by title or content
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', async (req, res) => {
    const query = req.query.query || '';
    const posts = await Post.find({
        $or: [
            { title: new RegExp(query, 'i') },
            { content: new RegExp(query, 'i') },
        ],
    });
    res.json(posts);
});

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post object
 *       404:
 *         description: Post not found
 */
router.get('/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created
 */
router.post('/', async (req, res) => {
    const { title, content, author } = req.body;
    const newPost = new Post({ title, content, author });
    await newPost.save();
    res.status(201).json(newPost);
});

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated post
 *       404:
 *         description: Post not found
 */
router.put('/:id', async (req, res) => {
    const { title, content, author } = req.body;
    const post = await Post.findByIdAndUpdate(
        req.params.id,
        { title, content, author },
        { new: true }
    );
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post successfully deleted
 *       404:
 *         description: Post not found
 */
router.delete('/:id', async (req, res) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post successfully deleted' });
});

module.exports = router;
