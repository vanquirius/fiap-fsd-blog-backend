// tests/posts.test.js
process.env.NODE_ENV = 'test';
process.env.SERVER_SECRET = 'test-secret';
process.env.JWT_SECRET = 'jwt-test-secret';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const authRouter = require('../routes/auth');
const postsRouter = require('../routes/posts');
const commentsRouter = require('../routes/comments');
const Post = require('../models/Post');

// ---------------------------------------------------------------------
// GLOBAL TEST SETUP
// ---------------------------------------------------------------------
let mongoServer;
let app;
let jwtToken;
let jwtUserId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    app.use('/posts', postsRouter);
    app.use('/posts', commentsRouter); // <-- ADD COMMENTS ROUTER

    // Create user + JWT for protected routes
    await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: '123456' });

    const loginRes = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: '123456' });

    jwtToken = loginRes.body.token;

    const decoded = require('jsonwebtoken').verify(jwtToken, process.env.JWT_SECRET);
    jwtUserId = decoded.id;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

afterEach(async () => {
    await Post.deleteMany({});
});

// Helpers
const authServerSecret = (req) =>
    req.set('Authorization', `Bearer ${process.env.SERVER_SECRET}`);

const authJwt = (req) =>
    req.set('Authorization', `Bearer ${jwtToken}`);


// ---------------------------------------------------------------------
// POSTS API — SERVER_SECRET REQUIRED FOR READ ROUTES
// ---------------------------------------------------------------------
describe('Posts API with Bearer SERVER_SECRET', () => {

    it('should reject GET requests without token', async () => {
        const res = await request(app).get('/posts');
        expect(res.statusCode).toBe(401);
    });

    it('should reject GET requests with invalid token', async () => {
        const res = await request(app)
            .get('/posts')
            .set('Authorization', 'Bearer invalid');

        expect(res.statusCode).toBe(401);
    });

    it('should allow GET /posts with SERVER_SECRET', async () => {
        await Post.create({ title: 'A', content: 'B' });

        const res = await authServerSecret(
            request(app).get('/posts')
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });

    it('should allow GET /posts/:id with SERVER_SECRET', async () => {
        const post = await Post.create({ title: 'A', content: 'B' });

        const res = await authServerSecret(
            request(app).get(`/posts/${post._id}`)
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('A');
    });

    it('should return 404 for non-existing ID', async () => {
        const res = await authServerSecret(
            request(app).get(`/posts/${new mongoose.Types.ObjectId()}`)
        );

        expect(res.statusCode).toBe(404);
    });

    it('should search posts with SERVER_SECRET', async () => {
        await Post.create({ title: 'Node.js', content: 'X' });
        await Post.create({ title: 'Python', content: 'Y' });

        const res = await authServerSecret(
            request(app).get('/posts/search').query({ query: 'Node' })
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Node.js');
    });
});


// ---------------------------------------------------------------------
// COMMENTS API — PUBLIC GET + SERVER_SECRET REQUIRED TO CREATE
// ---------------------------------------------------------------------
describe('Comments API', () => {

    it('should allow GET comments without any auth', async () => {
        const post = await Post.create({ title: 'P', content: 'C' });

        const res = await request(app).get(`/posts/${post._id}/comments`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });

    it('should reject POST comment without SERVER_SECRET', async () => {
        const post = await Post.create({ title: 'P', content: 'C' });

        const res = await request(app)
            .post(`/posts/${post._id}/comments`)
            .send({ text: 'Hello world', username: 'me' });

        expect(res.statusCode).toBe(401);
    });

    it('should allow POST comment with SERVER_SECRET', async () => {
        const post = await Post.create({ title: 'P', content: 'C' });

        const res = await authServerSecret(
            request(app).post(`/posts/${post._id}/comments`)
        ).send({
            text: 'Nice post!',
            username: 'marcelo'
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.text).toBe('Nice post!');
        expect(res.body.author).toBe('marcelo');
    });

    it('should store multiple comments and return them', async () => {
        const post = await Post.create({ title: 'P', content: 'C' });

        await authServerSecret(
            request(app).post(`/posts/${post._id}/comments`)
        ).send({ text: 'First!', username: 'john' });

        await authServerSecret(
            request(app).post(`/posts/${post._id}/comments`)
        ).send({ text: 'Second!', username: 'doe' });

        const res = await request(app).get(`/posts/${post._id}/comments`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body[0].text).toBe('First!');
        expect(res.body[1].text).toBe('Second!');
    });
});


// ---------------------------------------------------------------------
// POSTS API — JWT REQUIRED FOR WRITE ROUTES
// ---------------------------------------------------------------------
describe('Posts API (JWT protected write operations)', () => {

    it('should create a post with JWT', async () => {
        const res = await authJwt(
            request(app).post('/posts')
        ).send({
            title: 'Created',
            content: 'Hello'
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('Created');
    });

    it('should reject POST without JWT', async () => {
        const res = await request(app).post('/posts').send({
            title: 'X',
            content: 'Y'
        });

        expect(res.statusCode).toBe(401);
    });

    it('should reject POST with SERVER_SECRET', async () => {
        const res = await authServerSecret(
            request(app).post('/posts')
        ).send({
            title: 'X',
            content: 'Y'
        });

        expect(res.statusCode).toBe(401);
    });

    it('should update a post with JWT', async () => {
        const post = await Post.create({
            title: 'Old',
            content: 'Old',
            author: jwtUserId
        });

        const res = await authJwt(
            request(app).put(`/posts/${post._id}`)
        ).send({
            title: 'Updated'
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Updated');
    });

    it('should delete a post with JWT', async () => {
        const post = await Post.create({
            title: 'DeleteMe',
            content: 'X',
            author: jwtUserId
        });

        const res = await authJwt(
            request(app).delete(`/posts/${post._id}`)
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Post successfully deleted');

        const check = await Post.findById(post._id);
        expect(check).toBeNull();
    });
});


// ---------------------------------------------------------------------
// AUTH TESTS
// ---------------------------------------------------------------------
describe('Auth API', () => {

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'u1', password: 'p1' });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message');
    });

    it('should not register duplicate user', async () => {
        await request(app).post('/auth/register').send({ username: 'dup', password: 'x' });

        const res = await request(app)
            .post('/auth/register')
            .send({ username: 'dup', password: 'x' });

        expect(res.statusCode).toBe(400);
    });

    it('should login and return token', async () => {
        await request(app).post('/auth/register').send({ username: 'loginuser', password: 'mypw' });

        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'loginuser', password: 'mypw' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});
