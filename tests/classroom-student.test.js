const request = require('supertest');
const app     = require('../app');
const db      = require('./setup');

beforeAll(async () => { await db.init(app); });
afterEach(async () => { await db.clearDB(); });
afterAll(async ()  => { await db.disconnect(); });

let superadminToken;
let school;
let classroom;

const setup = async () => {
  const reg = await request(app).post('/api/auth/register').send({
    username: 'superadmin', email: 'sa@test.com', password: 'password123', role: 'superadmin',
  });
  superadminToken = reg.body.data.token;

  const schoolRes = await request(app).post('/api/schools')
    .set('Authorization', `Bearer ${superadminToken}`)
    .send({ name: 'Elm High', address: '1 Elm St' });
  school = schoolRes.body.data.school;

  const clsRes = await request(app).post('/api/classrooms')
    .set('Authorization', `Bearer ${superadminToken}`)
    .send({ name: 'Room 101', school: school._id, capacity: 2 });
  classroom = clsRes.body.data.classroom;
};

describe('Classroom Routes', () => {
  beforeEach(setup);

  it('creates a classroom', async () => {
    const res = await request(app).post('/api/classrooms')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ name: 'Room 202', school: school._id, capacity: 30 });
    expect(res.status).toBe(201);
    expect(res.body.data.classroom.name).toBe('Room 202');
  });

  it('gets classroom by id', async () => {
    const res = await request(app).get(`/api/classrooms/${classroom._id}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });

  it('updates a classroom', async () => {
    const res = await request(app).put(`/api/classrooms/${classroom._id}`)
      .set('Authorization', `Bearer ${superadminToken}`).send({ capacity: 50 });
    expect(res.status).toBe(200);
    expect(res.body.data.classroom.capacity).toBe(50);
  });

  it('deletes a classroom', async () => {
    const res = await request(app).delete(`/api/classrooms/${classroom._id}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Student Routes', () => {
  beforeEach(setup);

  const studentData = () => ({
    firstName: 'John', lastName: 'Doe',
    email: `john_${Date.now()}@test.com`,
    school: school._id, classroom: classroom._id,
  });

  it('enrolls a student', async () => {
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${superadminToken}`).send(studentData());
    expect(res.status).toBe(201);
    expect(res.body.data.student.firstName).toBe('John');
  });

  it('rejects enrollment above capacity', async () => {
    await request(app).post('/api/students').set('Authorization', `Bearer ${superadminToken}`)
      .send({ ...studentData(), email: `s1_${Date.now()}@test.com` });
    await request(app).post('/api/students').set('Authorization', `Bearer ${superadminToken}`)
      .send({ ...studentData(), email: `s2_${Date.now()}@test.com` });
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ ...studentData(), email: `s3_${Date.now()}@test.com` });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/full/i);
  });

  it('lists students', async () => {
    await request(app).post('/api/students').set('Authorization', `Bearer ${superadminToken}`)
      .send(studentData());
    const res = await request(app).get('/api/students')
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });

  it('transfers a student', async () => {
    const enroll = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${superadminToken}`).send(studentData());
    const studentId = enroll.body.data.student._id;
    const school2Res = await request(app).post('/api/schools')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ name: 'Oak Academy', address: '2 Oak Ave' });
    const school2 = school2Res.body.data.school;
    const res = await request(app).post(`/api/students/${studentId}/transfer`)
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ toSchool: school2._id, note: 'Family moved' });
    expect(res.status).toBe(200);
    expect(res.body.data.student.transferHistory.length).toBe(1);
  });

  it('deletes a student', async () => {
    const enroll = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${superadminToken}`).send(studentData());
    const studentId = enroll.body.data.student._id;
    const res = await request(app).delete(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${superadminToken}`);
    expect(res.status).toBe(200);
  });
});