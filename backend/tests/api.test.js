const request = require('supertest');
const mongoose = require('mongoose');
const db = require('./helpers/db');

let app; let Internship; let Company; let User; let Application; let Notification;
const day = 86400000;
const tokenOf = (res) => res.body.data.token;
const auth = (t) => ({ Authorization: `Bearer ${t}` });

const makeInternship = (companyId, over = {}) => Internship.create({
  companyId, title: 'Java Full Stack Developer Intern', description: 'Build things', domain: 'Java Development',
  requiredSkills: [{ name: 'Java', importance: 'High' }, { name: 'React', importance: 'High' }, { name: 'MongoDB', importance: 'Medium' }, { name: 'Spring Boot', importance: 'High' }],
  eligibility: { minCGPA: 7, branches: [], graduationYears: [], requiredDegree: 'Any' }, location: 'Pune', workMode: 'Hybrid', duration: 6,
  stipend: { min: 10000, max: 15000 }, applicationDeadline: new Date(Date.now() + 10 * day), status: 'active', approvalStatus: 'approved', tags: ['java', 'full stack'], ...over,
});

let studentToken; let companyToken; let adminToken; let company; let internship;

beforeAll(async () => {
  await db.connect();
  app = require('../app');
  Internship = require('../models/Internship'); Company = require('../models/Company'); User = require('../models/User');
  Application = require('../models/Application'); Notification = require('../models/Notification');
});
afterAll(db.disconnect);
beforeEach(async () => {
  await db.clear();
  const c = await request(app).post('/api/auth/register').send({ name: 'HR', email: 'hr@acme.com', password: 'Company@123', role: 'company', companyName: 'Acme' });
  companyToken = tokenOf(c);
  company = await Company.findOne({ userId: c.body.data.user._id });
  await User.create({ name: 'Admin', email: 'admin@x.com', password: 'Admin@123', role: 'admin' });
  adminToken = tokenOf(await request(app).post('/api/auth/login').send({ email: 'admin@x.com', password: 'Admin@123' }));
  const s = await request(app).post('/api/auth/register').send({ name: 'Stu', email: 'stu@x.com', password: 'Student@123', role: 'student' });
  studentToken = tokenOf(s);
  await request(app).put('/api/students/profile').set(auth(studentToken)).send({
    education: { degree: 'B.Tech', branch: 'Computer Science', college: 'COEP', graduationYear: 2026, cgpa: 8.2 },
    interests: ['Full Stack Development'], preferences: { locations: ['Pune'], workModes: ['Hybrid'], durationPreference: 6 },
  });
  for (const [name, proficiency] of [['Java', 'Advanced'], ['React', 'Intermediate'], ['MongoDB', 'Intermediate'], ['Node.js', 'Intermediate']]) {
    await request(app).post('/api/students/skills').set(auth(studentToken)).send({ name, proficiency });
  }
  await request(app).post('/api/students/projects').set(auth(studentToken)).send({ title: 'Expense Tracker', technologies: ['React', 'Node.js', 'MongoDB'] });
  internship = await makeInternship(company._id);
});

describe('authentication', () => {
  test('register returns token and never the password', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'New', email: 'new@x.com', password: 'Pass1234', role: 'student' });
    expect(r.status).toBe(201);
    expect(r.body.data.token).toBeTruthy();
    expect(JSON.stringify(r.body)).not.toMatch(/password/);
  });
  test('duplicate email -> 409', async () => {
    const r = await request(app).post('/api/auth/register').send({ name: 'Dup', email: 'stu@x.com', password: 'Pass1234', role: 'student' });
    expect(r.status).toBe(409);
  });
  test('login ok', async () => expect((await request(app).post('/api/auth/login').send({ email: 'stu@x.com', password: 'Student@123' })).status).toBe(200));
  test('invalid login -> 401', async () => expect((await request(app).post('/api/auth/login').send({ email: 'stu@x.com', password: 'wrong' })).status).toBe(401));
  test('protected route without / with invalid token -> 401', async () => {
    expect((await request(app).get('/api/students/profile')).status).toBe(401);
    expect((await request(app).get('/api/students/profile').set(auth('bad.token'))).status).toBe(401);
  });
  test('role-based authorization -> 403', async () => expect((await request(app).get('/api/admin/dashboard').set(auth(studentToken))).status).toBe(403));
});

describe('recommendations', () => {
  test('are generated dynamically, cached in MongoDB and explained', async () => {
    const r = await request(app).get('/api/recommendations').set(auth(studentToken));
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    const rec = r.body.data[0];
    expect(rec.overallScore).toBeGreaterThan(50);
    expect(rec.explanation.length).toBeGreaterThan(0);
    expect(rec.missingSkills.map((m) => m.name)).toContain('Spring Boot');
    expect(await mongoose.model('Recommendation').countDocuments()).toBe(1);
  });
  test('cache is refreshed when the profile changes', async () => {
    await request(app).get('/api/recommendations').set(auth(studentToken));
    const before = (await mongoose.model('Recommendation').findOne()).overallScore;
    await request(app).post('/api/students/skills').set(auth(studentToken)).send({ name: 'Spring Boot', proficiency: 'Advanced' });
    const r = await request(app).get('/api/recommendations').set(auth(studentToken));
    expect(r.body.data[0].overallScore).toBeGreaterThan(before);
  });
  test('skill gap endpoint returns classified gaps with learning path slot', async () => {
    const r = await request(app).get(`/api/skill-gaps/${internship._id}`).set(auth(studentToken));
    expect(r.status).toBe(200);
    expect(r.body.data.critical).toContain('Spring Boot');
  });
});

describe('applications', () => {
  test('valid application, notification to company', async () => {
    const r = await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: internship._id });
    expect(r.status).toBe(201);
    expect(r.body.data.matchScore).toBeGreaterThan(0);
    expect(await Notification.countDocuments({ type: 'new_application' })).toBe(1);
  });
  test('duplicate application -> 409', async () => {
    await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: internship._id });
    expect((await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: internship._id })).status).toBe(409);
  });
  test('ineligible application -> 403 with reason', async () => {
    const hard = await makeInternship(company._id, { eligibility: { minCGPA: 9.5 } });
    const r = await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: hard._id });
    expect(r.status).toBe(403);
    expect(r.body.details.reasons[0]).toMatch(/Minimum CGPA required: 9.5/);
  });
  test('expired internship -> 400', async () => {
    const old = await makeInternship(company._id, { applicationDeadline: new Date(Date.now() - day) });
    expect((await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: old._id })).status).toBe(400);
  });
  test('company updates status -> student notified; student cannot shortlist', async () => {
    const a = await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: internship._id });
    const id = a.body.data._id;
    expect((await request(app).put(`/api/applications/${id}/status`).set(auth(studentToken)).send({ status: 'Shortlisted' })).status).toBe(403);
    const r = await request(app).put(`/api/applications/${id}/status`).set(auth(companyToken)).send({ status: 'Shortlisted', note: 'Great fit' });
    expect(r.status).toBe(200);
    expect(r.body.data.statusHistory).toHaveLength(2);
    const n = await request(app).get('/api/notifications').set(auth(studentToken));
    expect(n.body.data.some((x) => x.type === 'shortlisted')).toBe(true);
  });
});

describe('MongoDB features', () => {
  test('CRUD: insert, find, findOne, updateOne, updateMany, deleteOne', async () => {
    const created = await makeInternship(company._id, { title: 'Temp Intern' });
    expect(await Internship.findOne({ title: 'Temp Intern' })).toBeTruthy();
    expect((await Internship.updateOne({ _id: created._id }, { $set: { duration: 3 } })).modifiedCount).toBe(1);
    expect((await Internship.updateMany({ companyId: company._id }, { $set: { openings: 9 } })).matchedCount).toBe(2);
    expect((await Internship.deleteOne({ _id: created._id })).deletedCount).toBe(1);
    expect((await Internship.find({ companyId: company._id })).length).toBe(1);
  });
  test('text-index search + regex fallback + operators', async () => {
    await makeInternship(company._id, { title: 'Python Data Intern', domain: 'Data Science', location: 'Remote', workMode: 'Remote', tags: ['python'], requiredSkills: [{ name: 'Python', importance: 'High' }] });
    const t = await request(app).get('/api/internships').query({ q: 'python' });
    expect(t.body.data.map((i) => i.title)).toEqual(['Python Data Intern']);
    expect(t.body.meta.searchMode).toBe('text-index');
    const rx = await request(app).get('/api/internships').query({ q: 'pyth' });
    expect(rx.body.meta.searchMode).toBe('regex-fallback');
    expect(rx.body.data).toHaveLength(1);
    const f = await request(app).get('/api/internships').query({ location: 'Pune,Mumbai', workMode: 'Hybrid', minStipend: 12000 });
    expect(f.body.data.map((i) => i.location)).toEqual(['Pune']);
  });
  test('indexes exist (text, compound, unique)', async () => {
    const names = (await Internship.collection.indexes()).map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(['internship_text_idx', 'status_1_approvalStatus_1_applicationDeadline_1']));
    const appIdx = await Application.collection.indexes();
    expect(appIdx.some((i) => i.unique && i.key.studentId && i.key.internshipId)).toBe(true);
  });
  test('aggregation: admin analytics from MongoDB', async () => {
    await request(app).get('/api/recommendations').set(auth(studentToken));
    await request(app).post('/api/applications').set(auth(studentToken)).send({ internshipId: internship._id });
    const r = await request(app).get('/api/admin/analytics').set(auth(adminToken));
    expect(r.status).toBe(200);
    const { charts, overview, highlights } = r.body.data;
    expect(overview.totalStudents).toBe(1);
    expect(charts.skillDemand[0].count).toBe(1);
    expect(charts.internshipsByDomain[0]).toEqual({ name: 'Java Development', count: 1 });
    expect(charts.applicationsByStatus[0]).toEqual({ name: 'Applied', count: 1 });
    expect(charts.topSkillGaps.map((g) => g.name)).toContain('Spring Boot');
    expect(highlights.mostCommonSkillGap).toBe('Spring Boot');
  });
});
