process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.SERVER_SECRET = process.env.SERVER_SECRET || 'test-server-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../app');

let server;
let mongoServer;
let jwtToken;
let teacherId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.disconnect();
    await mongoose.connect(mongoUri);

    server = http.createServer(app);

    // Bootstrap first teacher
    await request(server)
        .post('/auth/register')
        .set('Authorization', process.env.SERVER_SECRET)
        .send({
            name: 'Root Teacher',
            username: 'rootteacher',
            password: 'password123',
            type: 'teacher'
        })
        .expect(201);

    const loginRes = await request(server)
        .post('/auth/login')
        .send({
            username: 'rootteacher',
            password: 'password123'
        });

    jwtToken = loginRes.body.token;
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    teacherId = decoded.id;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    await server.close();
});


// ---------------------------------------------------------------------
// TEACHERS API
// ---------------------------------------------------------------------

describe('Teachers API', () => {

    test('should reject creating teacher without JWT', async () => {
        const res = await request(server)
            .post('/teachers')
            .send({
                name: 'Fail',
                username: 'fail',
                password: 'fail'
            });

        expect(res.status).toBe(401);
    });

    test('should create a teacher with JWT', async () => {
        const res = await request(server)
            .post('/teachers')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                name: 'Second Teacher',
                username: 'teacher2',
                password: 'password123'
            });

        expect(res.status).toBe(201);
        expect(res.body.teacher).toBeDefined();
        expect(res.body.teacher.username).toBe('teacher2');
    });

    test('should list teachers with JWT', async () => {
        const res = await request(server)
            .get('/teachers')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return 404 for non-existing teacher', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(server)
            .get(`/teachers/${fakeId}`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(res.status).toBe(404);
    });
});
