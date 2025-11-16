const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Use SERVER_SECRET for token signing
const JWT_SECRET = process.env.SERVER_SECRET || 'default-server-secret';

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ error: 'Username and password are required' });

        // Check if user exists
        const existing = await User.findOne({ username });
        if (existing)
            return res.status(400).json({ error: 'User already exists' });

        const newUser = await User.create({ username, password });

        return res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser._id, username: newUser.username }
        });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ error: 'Invalid username or password' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch)
            return res.status(401).json({ error: 'Invalid username or password' });

        // Sign JWT using SERVER_SECRET
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: '7d',
        });

        return res.json({
            token,
            username: user.username,
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;