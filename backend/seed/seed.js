/**
 * Seed script:  npm run seed
 * WARNING: clears all collections in the database pointed to by MONGODB_URI.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const initIndexes = require('../config/indexes');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Recommendation = require('../models/Recommendation');
const SavedInternship = require('../models/SavedInternship');
const Notification = require('../models/Notification');
const SkillCatalog = require('../models/SkillCatalog');
const LearningResource = require('../models/LearningResource');
const ActivityHistory = require('../models/ActivityHistory');
const { normalizeSkill } = require('../utils/skillUtils');
const { getEngine } = require('../services/engines');
const recService = require('../services/recommendationService');
const data = require('./data');

const STUDENT_PASSWORD = 'Student@123';
const COMPANY_PASSWORD = 'Company@123';
const ADMIN_PASSWORD = 'Admin@123';

const FLOW = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];
const OUTCOMES = ['Applied', 'Applied', 'Under Review', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn'];

async function main() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([User, StudentProfile, Company, Internship, Application, Recommendation, SavedInternship, Notification, SkillCatalog, LearningResource, ActivityHistory].map((m) => m.deleteMany({})));
  const idx = await initIndexes();
  console.log('Indexes created:', Object.entries(idx).map(([c, n]) => `${c}: ${n.join(', ')}`).join('\n  '));

  // 1. catalog + learning resources
  await SkillCatalog.insertMany(data.SKILL_CATALOG.map((s) => ({ ...s, key: normalizeSkill(s.name), aliases: [] })));
  await LearningResource.insertMany(data.LEARNING.map((l) => ({ ...l, skillKey: normalizeSkill(l.skill) })));

  // 2. users (User.create runs the bcrypt pre-save hook; insertMany would not)
  const admin = await User.create({ name: 'Placement Officer', email: 'admin@example.com', password: ADMIN_PASSWORD, role: 'admin', phone: '9000000000' });
  const companyUsers = [];
  for (const c of data.COMPANIES) companyUsers.push(await User.create({ name: `${c.name} HR`, email: c.email, password: COMPANY_PASSWORD, role: 'company', phone: '9111111111' }));
  const companies = await Company.create(data.COMPANIES.map((c, i) => ({
    userId: companyUsers[i]._id, companyName: c.name, industry: c.industry, location: c.location, companySize: c.size, verified: i < 8,
    website: `https://www.${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`, description: `${c.name} is a ${c.industry.toLowerCase()} company based in ${c.location}, hiring interns every quarter.`,
  })));

  // 3. students
  const studentDefs = data.buildStudents();
  const studentUsers = [];
  for (const s of studentDefs) studentUsers.push(await User.create({ name: s.name, email: s.email, password: STUDENT_PASSWORD, role: 'student', phone: '9222222222' }));
  const profiles = await StudentProfile.create(studentDefs.map((s, i) => ({
    userId: studentUsers[i]._id,
    education: { degree: s.degree, branch: s.branch, college: s.college, graduationYear: s.year, cgpa: s.cgpa },
    skills: s.skills, projects: s.projects, certifications: s.certs, interests: s.interests, preferences: s.prefs,
  })));

  // 4. internships
  const internshipDefs = data.buildInternships();
  const internships = await Internship.create(internshipDefs.map((d) => ({ ...d, companyId: companies[d.companyIndex]._id })));

  // 5. applications (only for internships the student is eligible for - uses the real engine)
  const engine = getEngine();
  const open = internships.filter((i) => i.status === 'active' && i.approvalStatus === 'approved' && i.applicationDeadline > new Date());
  const companyById = new Map(companies.map((c) => [String(c._id), c]));
  let appCount = 0;
  for (let si = 0; si < profiles.length; si += 1) {
    if (si > 4 && si % 3 === 0) continue; // some students have no applications
    const profile = profiles[si];
    const scored = open.map((i) => ({ i, m: engine.score(profile, i) })).filter((x) => x.m.eligibility.status !== 'NOT_ELIGIBLE').sort((a, b) => b.m.overallScore - a.m.overallScore);
    const take = si < 4 ? 2 : data.between(1, 3);
    const chosen = scored.slice(si < 4 ? 1 : 0, (si < 4 ? 1 : 0) + take + data.between(0, 1)).slice(0, take);
    for (const { i, m } of chosen) {
      const status = si === 0 && appCount === 0 ? 'Under Review' : si === 0 ? 'Shortlisted' : data.pick(OUTCOMES);
      const appliedAt = new Date(Date.now() - data.between(2, 150) * 86400000);
      const steps = status === 'Rejected' ? ['Applied', 'Under Review', 'Rejected'] : status === 'Withdrawn' ? ['Applied', 'Withdrawn'] : FLOW.slice(0, FLOW.indexOf(status) + 1);
      const company = companyById.get(String(i.companyId));
      await Application.create({
        studentId: studentUsers[si]._id, internshipId: i._id, companyId: i.companyId, status, appliedAt, createdAt: appliedAt,
        statusHistory: steps.map((s, k) => ({ status: s, changedAt: new Date(appliedAt.getTime() + k * 2 * 86400000), note: k === 0 ? 'Application submitted' : '' })),
        matchScore: m.overallScore, skillMatchPercentage: m.skillMatchPercentage, eligibilityScore: m.scores.eligibility,
        snapshot: { studentName: studentDefs[si].name, college: studentDefs[si].college, cgpa: studentDefs[si].cgpa, internshipTitle: i.title, companyName: company.companyName },
      });
      appCount += 1;
      if (status === 'Shortlisted' || status === 'Selected' || status === 'Rejected') {
        await Notification.create({ userId: studentUsers[si]._id, type: status === 'Rejected' ? 'rejected' : 'shortlisted', title: status === 'Rejected' ? 'Application Rejected' : status === 'Selected' ? 'You were selected!' : 'You have been shortlisted!', message: `${company.companyName} updated "${i.title}" to ${status}.`, link: '/student/applications', read: si > 4 });
      }
    }
  }

  // 6. saved internships for demo students (soon-to-expire ones so deadline alerts are visible)
  const soon = open.slice().sort((a, b) => a.applicationDeadline - b.applicationDeadline).slice(0, 3);
  for (const u of studentUsers.slice(0, 4)) for (const i of soon) await SavedInternship.updateOne({ studentId: u._id, internshipId: i._id }, { $setOnInsert: { savedAt: new Date() } }, { upsert: true });

  // 7. recommendations for every student (stored/cached in MongoDB)
  for (const u of studentUsers) await recService.generateForStudent(u._id);

  const counts = {};
  for (const m of [User, StudentProfile, Company, Internship, Application, Recommendation, SavedInternship, Notification, SkillCatalog, LearningResource, ActivityHistory]) counts[m.collection.name] = await m.countDocuments();
  console.log('\nSeed complete:', counts);
  console.log(`\nDemo logins:\n  student : student@example.com  / ${STUDENT_PASSWORD}  (Java+Spring+MongoDB)\n  student2: student2@example.com / ${STUDENT_PASSWORD}  (React+Node+MongoDB)\n  student3: student3@example.com / ${STUDENT_PASSWORD}  (Python+ML+Pandas)\n  student4: student4@example.com / ${STUDENT_PASSWORD}  (UI/UX+Figma)\n  company : company@example.com  / ${COMPANY_PASSWORD}  (ABC Technologies; company2..10@example.com also work)\n  admin   : ${admin.email}    / ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error('Seed failed:', e); await mongoose.disconnect(); process.exit(1); });
