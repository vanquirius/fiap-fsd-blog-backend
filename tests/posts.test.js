// tests/posts.test.js
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');
const Post = require('../models/Post');

let server;
let mongoServer;
let jwtToken;
let jwtUserId;

beforeAll(async () => {
    // ---- In-memory MongoDB ----
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.disconnect();
    await mongoose.connect(mongoUri);

    // ---- HTTP server for Supertest ----
    server = http.createServer(app);

// ---- Bootstrap teacher via AUTH (SERVER_SECRET) ----
    await request(server)
        .post('/auth/register')
        .set('Authorization', process.env.SERVER_SECRET)
        .send({
            name: 'Teacher User',
            username: 'teacheruser1',
            password: 'secretpassword123',
            type: 'teacher'
        })
        .expect(201);

// ---- Login as teacher ----
    const loginRes = await request(server)
        .post('/auth/login')
        .send({
            username: 'teacheruser1',
            password: 'secretpassword123'
        });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    jwtToken = loginRes.body.token;

    const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);
    jwtUserId = decodedToken.id;
});

afterEach(async () => {
    await Post.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    await server.close();
});


// ---------------------------------------------------------------------
// POSTS API (READ with SERVER_SECRET)
// ---------------------------------------------------------------------

describe('Posts API with Bearer SERVER_SECRET', () => {

    test('should reject GET requests without token', async () => {
        const res = await request(server).get('/posts');
        expect(res.status).toBe(401);
    });

    test('should reject GET requests with invalid token', async () => {
        const res = await request(server)
            .get('/posts')
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).toBe(401);
    });

    test('should allow GET /posts with SERVER_SECRET', async () => {
        const res = await request(server)
            .get('/posts')
            .set('Authorization', `Bearer ${process.env.SERVER_SECRET}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return 404 for non-existing ID', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(server)
            .get(`/posts/${fakeId}`)
            .set('Authorization', `Bearer ${process.env.SERVER_SECRET}`);

        expect(res.status).toBe(404);
    });
});


// ---------------------------------------------------------------------
// POSTS API (WRITE with JWT)
// ---------------------------------------------------------------------

describe('Posts API (JWT protected write operations)', () => {

    test('should create a post with JWT', async () => {
        const res = await request(server)
            .post('/posts')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                title: 'Test Post',
                content: 'Test content'
            });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Test Post');
        expect(res.body.author.toString()).toBe(jwtUserId);
    });

    test('should reject POST without JWT', async () => {
        const res = await request(server)
            .post('/posts')
            .send({
                title: 'Fail',
                content: 'Fail'
            });

        expect(res.status).toBe(401);
    });

    test('should reject POST with SERVER_SECRET', async () => {
        const res = await request(server)
            .post('/posts')
            .set('Authorization', `Bearer ${process.env.SERVER_SECRET}`)
            .send({
                title: 'Fail',
                content: 'Fail'
            });

        expect(res.status).toBe(401);
    });
});


// ---------------------------------------------------------------------
// COMMENTS API
// ---------------------------------------------------------------------

describe('Comments API', () => {

    test('should allow GET comments without auth', async () => {
        const post = await Post.create({
            title: 'Post',
            content: 'Content',
            author: jwtUserId
        });

        const res = await request(server)
            .get(`/posts/${post._id}/comments`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should reject POST comment without SERVER_SECRET', async () => {
        const post = await Post.create({
            title: 'Post',
            content: 'Content',
            author: jwtUserId
        });

        const res = await request(server)
            .post(`/posts/${post._id}/comments`)
            .send({ content: 'Hello' });

        expect(res.status).toBe(401);
    });

    test('should allow POST comment with SERVER_SECRET', async () => {
        const post = await Post.create({
            title: 'Post',
            content: 'Content',
            author: jwtUserId
        });

        const res = await request(server)
            .post(`/posts/${post._id}/comments`)
            .set('Authorization', `Bearer ${process.env.SERVER_SECRET}`)
            .send({ content: 'Nice post' });

        expect(res.status).toBe(400);
    });
});