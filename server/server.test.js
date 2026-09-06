import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, initDatabase } from './server.js';

describe('Poker Backend API Integration Tests', () => {
    let authToken = '';
    const testUser = {
        username: `tester_${Date.now()}`,
        password: 'TestPassword123'
    };

    beforeAll(async () => {
        await initDatabase();
    });

    describe('Health Check Endpoint', () => {
        it('GET /api/coach/health returns online status', async () => {
            const res = await request(app).get('/api/coach/health');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'online');
            expect(res.body).toHaveProperty('models');
        });
    });

    describe('Authentication Endpoints', () => {
        it('POST /api/register rejects invalid input (password too short)', async () => {
            const res = await request(app)
                .post('/api/register')
                .send({ username: 'ab', password: '12' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid input');
        });

        it('POST /api/register creates a new user and returns JWT token', async () => {
            const res = await request(app)
                .post('/api/register')
                .send(testUser);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('username', testUser.username);
            expect(res.body).not.toHaveProperty('password');
        });

        it('POST /api/login rejects incorrect credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: testUser.username, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('POST /api/login authenticates valid user and returns JWT token', async () => {
            const res = await request(app)
                .post('/api/login')
                .send(testUser);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('username', testUser.username);
            expect(res.body).not.toHaveProperty('password');

            authToken = res.body.token;
            expect(typeof authToken).toBe('string');
            expect(authToken.length).toBeGreaterThan(20);
        });
    });

    describe('Session & Hand Protected Endpoints', () => {
        it('GET /api/sessions rejects requests without token', async () => {
            const res = await request(app).get('/api/sessions');
            expect(res.status).toBe(401);
        });

        it('GET /api/sessions returns session array for authenticated user', async () => {
            const res = await request(app)
                .get('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('POST /api/sessions saves a valid session record', async () => {
            const testSessionId = `sess_test_${Date.now()}`;
            const sessionPayload = {
                id: testSessionId,
                date: new Date().toISOString(),
                mode: 'cash',
                handsPlayed: 10,
                chipsWon: 50,
                difficulty: 'advanced'
            };

            const res = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .send(sessionPayload);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });

            // Clean up by deleting the test session
            const delRes = await request(app)
                .delete(`/api/sessions/${testSessionId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(delRes.status).toBe(200);
        });
    });
});
