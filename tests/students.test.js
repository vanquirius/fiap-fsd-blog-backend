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
let studentId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.disconnect();
    await mongoose.connect(mongoUri);

    server = http.createServer(app);

    // Bootstrap teacher
    await request(server)
        .post('/auth/register')
        .set('Authorization', process.env.SERVER_SECRET)
        .send({
            name: 'Teacher',
            username: 'teacher1',
            password: 'password123',
            type: 'teacher'
        })
        .expect(201);

    const loginRes = await request(server)
        .post('/auth/login')
        .send({
            username: 'teacher1',
            password: 'password123'
        });

    jwtToken = loginRes.body.token;
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    await server.close();
});


// ---------------------------------------------------------------------
// STUDENTS API
// ---------------------------------------------------------------------

describe('Students API', () => {

    test('should reject creating student without JWT', async () => {
        const res = await request(server)
            .post('/students')
            .send({
                name: 'Fail',
                username: 'fail',
                password: 'fail'
            });

        expect(res.status).toBe(401);
    });

    test('should create a student with JWT', async () => {
        const res = await request(server)
            .post('/students')
            .set('Authorization', `Bearer ${jwtToken}`)
            .send({
                name: 'Student One',
                username: 'student1',
                password: 'password123'
            });

        expect(res.status).toBe(201);
        expect(res.body.student).toBeDefined();

        studentId = res.body.student.id;
    });

    test('should list students with JWT', async () => {
        const res = await request(server)
            .get('/students')
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return 404 for non-existing student', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(server)
            .get(`/students/${fakeId}`)
            .set('Authorization', `Bearer ${jwtToken}`);

        expect(res.status).toBe(404);
    });
});
