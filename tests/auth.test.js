const request = require('supertest');
const app     = require('../app');
const db      = require('./setup');

beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clearDB(); });
afterAll(async ()  => { await db.disconnect(); });

describe('Auth Routes', () => {
  const superadmin = {
    username: 'admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'superadmin',
  };

  describe('POST /api/auth/register', () => {
    it('should register a superadmin', async () => {
      const res = await request(app).post('/api/auth/register').send(superadmin);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(superadmin);
      const res = await request(app).post('/api/auth/register').send(superadmin);
      expect(res.status).toBe(409);
    });

    it('should reject invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...superadmin, email: 'bad' });
      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({ ...superadmin, password: '123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(superadmin);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: superadmin.email,
        password: superadmin.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: superadmin.email,
        password: 'wrong',
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com',
        password: 'password',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const reg = await request(app).post('/api/auth/register').send(superadmin);
      const token = reg.body.data.token;
      const res = await request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(superadmin.email);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
