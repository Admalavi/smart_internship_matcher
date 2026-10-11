const express = require('express');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { uploadImage, uploadResume } = require('../middleware/upload');
const auth = require('../controllers/authController');
const student = require('../controllers/studentController');
const internship = require('../controllers/internshipController');
const rec = require('../controllers/recommendationController');
const gap = require('../controllers/skillGapController');
const app = require('../controllers/applicationController');
const saved = require('../controllers/savedController');
const company = require('../controllers/companyController');
const admin = require('../controllers/adminController');
const notif = require('../controllers/notificationController');
const catalog = require('../controllers/catalogController');

const r = express.Router();
const S = [protect, authorize('student')];
const C = [protect, authorize('company')];
const A = [protect, authorize('admin')];

// Auth
r.post('/auth/register', auth.register);
r.post('/auth/login', auth.login);
r.post('/auth/logout', protect, auth.logout);
r.get('/auth/me', protect, auth.me);

// Student profile
r.get('/students/profile', S, student.getProfile);
r.put('/students/profile', S, student.updateProfile);
r.get('/students/dashboard', S, student.dashboard);
r.get('/students/activity', S, student.activity);
r.post('/students/skills', S, student.addSkill);
r.delete('/students/skills/:id', S, student.removeSkill);
r.post('/students/projects', S, student.addProject);
r.delete('/students/projects/:id', S, student.removeProject);
r.post('/students/certifications', S, student.addCertification);
r.delete('/students/certifications/:id', S, student.removeCertification);
r.post('/students/resume', S, uploadResume.single('resume'), student.uploadResume);
r.post('/students/resume/parse', S, uploadResume.single('resume'), student.parseResume);

// Internships (public browse with optional auth for match scores)
r.get('/internships/facets', internship.facets);
r.get('/internships', optionalAuth, internship.list);
r.get('/internships/:id', optionalAuth, internship.getOne);
r.post('/internships', C, internship.create);
r.put('/internships/:id', protect, authorize('company', 'admin'), internship.update);
r.delete('/internships/:id', protect, authorize('company', 'admin'), internship.remove);

// Recommendations & skill gaps
r.get('/recommendations/history', S, rec.history);
r.get('/recommendations', S, rec.list);
r.post('/recommendations/generate', S, rec.generate);
r.get('/recommendations/:internshipId', S, rec.getOne);
r.get('/skill-gaps', S, gap.overview);
r.get('/skill-gaps/:internshipId', S, gap.forInternship);

// Applications
r.post('/applications', S, app.apply);
r.get('/applications', protect, app.list);
r.get('/applications/:id', protect, app.getOne);
r.put('/applications/:id/status', protect, app.updateStatus);

// Saved
r.get('/saved', S, saved.list);
r.post('/saved/:internshipId', S, saved.save);
r.delete('/saved/:internshipId', S, saved.unsave);

// Company
r.get('/company/profile', C, company.getProfile);
r.put('/company/profile', C, company.updateProfile);
r.post('/company/logo', C, uploadImage.single('logo'), company.uploadLogo);
r.get('/company/dashboard', C, company.dashboard);
r.get('/company/internships', C, company.internships);
r.get('/company/applications', C, company.applications);
r.get('/company/applications/:id', C, company.candidate);

// Admin
r.get('/admin/dashboard', A, admin.dashboard);
r.get('/admin/analytics', A, admin.analytics);
r.get('/admin/users', A, admin.users);
r.put('/admin/users/:id/status', A, admin.setUserStatus);
r.delete('/admin/users/:id', A, admin.deleteUser);
r.get('/admin/companies', A, admin.companies);
r.put('/admin/companies/:id/verify', A, admin.verifyCompany);
r.get('/admin/internships', A, admin.internships);
r.put('/admin/internships/:id/approval', A, admin.setApproval);
r.get('/admin/applications', A, admin.applications);

// Notifications & catalog
r.get('/notifications', protect, notif.list);
r.get('/notifications/unread-count', protect, notif.unreadCount);
r.put('/notifications/read-all', protect, notif.markAllRead);
r.put('/notifications/:id/read', protect, notif.markRead);
r.delete('/notifications/:id', protect, notif.remove);
r.get('/catalog/skills', catalog.skills);
r.get('/catalog/stats', catalog.publicStats);
r.get('/catalog/learning/:skill', catalog.learning);

module.exports = r;
