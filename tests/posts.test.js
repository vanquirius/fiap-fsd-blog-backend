// tests/posts.test.js
process.env.NODE_ENV = 'test';
process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const authRouter = require('../routes/auth');
const postsRouter = require('../routes/posts');

let mongoServer;
let app;
let Post;

// Helper to attach SERVER_SECRET-based auth
const auth = (req) =>
    req.set('Authorization', `Bearer ${process.env.SERVER_SECRET}`);

// ------------------------------
// GLOBAL TEST SETUP
// ------------------------------
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);

    Post = mongoose.models.Post;

    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    app.use('/posts', postsRouter);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await Post.deleteMany({});
});

// ------------------------------
// POSTS API TESTS
// ------------------------------
describe('Posts API with Bearer token', () => {

    it('should reject requests without token', async () => {
        const res = await request(app).get('/posts');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Missing or invalid Authorization header');
    });

    it('should create a new post', async () => {
        const res = await auth(request(app).post('/posts')).send({
            title: 'Test Post',
            content: 'Hello',
            author: 'Author',
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.title).toBe('Test Post');
    });

    it('should list all posts', async () => {
        await Post.create({ title: 'A', content: 'B', author: 'C' });

        const res = await auth(request(app).get('/posts'));
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });

    it('should get a post by id', async () => {
        const post = await Post.create({ title: 'A', content: 'B', author: 'C' });

        const res = await auth(request(app).get(`/posts/${post._id}`));
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('A');
    });

    it('should return 404 for non-existing post', async () => {
        const res = await auth(
            request(app).get(`/posts/${new mongoose.Types.ObjectId()}`)
        );
        expect(res.statusCode).toBe(404);
    });

    it('should search posts', async () => {
        await Post.create({ title: 'Node.js', content: 'Test', author: 'M' });
        await Post.create({ title: 'Python', content: 'Another', author: 'M' });

        const res = await auth(request(app).get('/posts/search')).query({
            query: 'Node'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Node.js');
    });

    it('should update a post', async () => {
        const post = await Post.create({ title: 'Old', content: 'Old', author: 'M' });

        const res = await auth(request(app).put(`/posts/${post._id}`)).send({
            title: 'New',
            content: 'New',
            author: 'M'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('New');
    });

    it('should delete a post', async () => {
        const post = await Post.create({ title: 'ToDelete', content: 'X', author: 'M' });

        const res = await auth(request(app).delete(`/posts/${post._id}`));
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Post successfully deleted');

        const check = await Post.findById(post._id);
        expect(check).toBeNull();
    });
});

// ------------------------------
// AUTH TESTS
// ------------------------------
describe('Auth API', () => {

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message');
    });

    it('should not register the same user twice', async () => {
        await request(app).post('/auth/register').send({
            username: 'duplicate', password: '123'
        });

        const res = await request(app).post('/auth/register').send({
            username: 'duplicate', password: '123'
        });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'User already exists');
    });

    it('should login a user and return a token', async () => {
        await request(app).post('/auth/register').send({
            username: 'loginuser', password: 'mypassword'
        });

        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'loginuser', password: 'mypassword' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});

// ------------------------------
// PROTECTED ROUTES WITH JWT TESTS
// ------------------------------
describe('Protected routes with JWT token', () => {

    let token;

    beforeEach(async () => {
        await request(app).post('/auth/register').send({
            username: 'jwtuser', password: 'abc123'
        });

        const res = await request(app).post('/auth/login').send({
            username: 'jwtuser', password: 'abc123'
        });

        token = res.body.token;
    });

    it('should reject without token', async () => {
        const res = await request(app).get('/posts');
        expect(res.statusCode).toBe(401);
    });

    it('should allow access with JWT', async () => {
        const res = await request(app)
            .get('/posts')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
    });

    it('should allow creating a post', async () => {
        const res = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'JWT Post',
                content: 'Content',
                author: 'jwtuser'
            });

        expect(res.statusCode).toBe(201);
    });

    it('should reject invalid token', async () => {
        const res = await request(app)
            .get('/posts')
            .set('Authorization', 'Bearer invalid');

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid token');
    });
});
