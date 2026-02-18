const request = require('supertest');
const app     = require('../app');
const db      = require('./setup');

beforeAll(async () => { await db.init(app); });
afterEach(async () => { await db.clearDB(); });
afterAll(async ()  => { await db.disconnect(); });

const getToken = async (role = 'superadmin', schoolId = null) => {
  const payload = {
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@test.com`,
    password: 'password123',
    role,
  };
  if (schoolId) payload.school = schoolId;
  const res = await request(app).post('/api/auth/register').send(payload);
  return res.body.data?.token;
};

const schoolData = { name: 'Test School', address: '123 Main St' };

describe('School Routes', () => {
  describe('POST /api/schools', () => {
    it('superadmin can create a school', async () => {
      const token = await getToken('superadmin');
      const res = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${token}`).send(schoolData);
      expect(res.status).toBe(201);
      expect(res.body.data.school.name).toBe(schoolData.name);
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).post('/api/schools').send(schoolData);
      expect(res.status).toBe(401);
    });

    it('rejects missing required fields', async () => {
      const token = await getToken('superadmin');
      const res = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${token}`).send({ name: 'Only Name' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/schools', () => {
    it('returns list of schools', async () => {
      const token = await getToken('superadmin');
      await request(app).post('/api/schools').set('Authorization', `Bearer ${token}`).send(schoolData);
      const res = await request(app).get('/api/schools').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/schools/:id', () => {
    it('superadmin can update a school', async () => {
      const token = await getToken('superadmin');
      const created = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${token}`).send(schoolData);
      const id = created.body.data.school._id;
      const res = await request(app).put(`/api/schools/${id}`)
        .set('Authorization', `Bearer ${token}`).send({ name: 'Updated School' });
      expect(res.status).toBe(200);
      expect(res.body.data.school.name).toBe('Updated School');
    });
  });

  describe('DELETE /api/schools/:id', () => {
    it('superadmin can delete a school', async () => {
      const token = await getToken('superadmin');
      const created = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${token}`).send(schoolData);
      const id = created.body.data.school._id;
      const res = await request(app).delete(`/api/schools/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('RBAC', () => {
    it('school_admin cannot create a school', async () => {
      const adminToken = await getToken('superadmin');
      const schoolRes = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${adminToken}`).send(schoolData);
      const schoolId = schoolRes.body.data.school._id;
      const saToken = await getToken('school_admin', schoolId);
      const res = await request(app).post('/api/schools')
        .set('Authorization', `Bearer ${saToken}`).send({ name: 'New School', address: '456 St' });
      expect(res.status).toBe(403);
    });
  });
});