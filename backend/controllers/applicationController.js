const Application = require('../models/Application');
const Internship = require('../models/Internship');
const StudentProfile = require('../models/StudentProfile');
const Company = require('../models/Company');
const SavedInternship = require('../models/SavedInternship');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getEngine } = require('../services/engines');
const { notify } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');
const { APPLICATION_STATUSES, COMPANY_SETTABLE_STATUSES } = require('../utils/constants');

/** Student applies. Validates profile, internship state, deadline, duplicates and eligibility. */
exports.apply = asyncHandler(async (req, res) => {
  const { internshipId, coverNote } = req.body;
  if (!internshipId) throw new ApiError(400, 'internshipId is required');
  const profile = await StudentProfile.findOne({ userId: req.user._id });
  if (!profile || !profile.skills.length) throw new ApiError(400, 'Please complete your profile (add at least one skill) before applying');
  const internship = await Internship.findById(internshipId).populate('companyId');
  if (!internship || internship.approvalStatus !== 'approved') throw new ApiError(404, 'Internship not found');
  if (internship.status !== 'active') throw new ApiError(400, 'This internship is closed');
  if (new Date(internship.applicationDeadline) < new Date()) throw new ApiError(400, 'The application deadline for this internship has passed');
  if (await Application.exists({ studentId: req.user._id, internshipId })) throw new ApiError(409, 'You have already applied to this internship');

  const match = getEngine().score(profile, internship);
  if (match.eligibility.status === 'NOT_ELIGIBLE') {
    throw new ApiError(403, 'You are not currently eligible for this internship.', { reasons: match.eligibility.reasons });
  }
  const app = await Application.create({
    studentId: req.user._id, internshipId, companyId: internship.companyId._id, coverNote,
    status: 'Applied', statusHistory: [{ status: 'Applied', note: 'Application submitted' }],
    matchScore: match.overallScore, skillMatchPercentage: match.skillMatchPercentage, eligibilityScore: match.scores.eligibility,
    snapshot: { studentName: req.user.name, college: profile.education.college, cgpa: profile.education.cgpa, internshipTitle: internship.title, companyName: internship.companyId.companyName },
  });
  await notify(internship.companyId.userId, {
    type: 'new_application', title: 'New application', message: `${req.user.name} applied to "${internship.title}" (${match.overallScore}% match).`, link: '/company/applications',
  });
  logActivity(req.user._id, 'internship_applied', { entityType: 'internship', entityId: internship._id, meta: { title: internship.title, score: match.overallScore } });
  res.status(201).json({ success: true, data: app, warnings: match.eligibility.status === 'PARTIALLY_ELIGIBLE' ? match.eligibility.reasons : [] });
});

const populateApp = [
  { path: 'internshipId', select: 'title domain location workMode duration stipend applicationDeadline status', populate: { path: 'companyId', select: 'companyName logo' } },
];

exports.list = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'student') filter.studentId = req.user._id;
  else if (req.user.role === 'company') {
    const c = await Company.findOne({ userId: req.user._id });
    filter.companyId = c?._id;
  }
  if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };
  const apps = await Application.find(filter).sort({ appliedAt: -1 }).populate(populateApp).lean();
  const grouped = APPLICATION_STATUSES.reduce((acc, s) => { acc[s] = apps.filter((a) => a.status === s); return acc; }, {});
  res.json({ success: true, data: apps, grouped });
});

exports.getOne = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id).populate(populateApp).lean();
  if (!app) throw new ApiError(404, 'Application not found');
  if (req.user.role === 'student' && String(app.studentId) !== String(req.user._id)) throw new ApiError(403, 'Not your application');
  if (req.user.role === 'company') {
    const c = await Company.findOne({ userId: req.user._id });
    if (String(app.companyId) !== String(c?._id)) throw new ApiError(403, 'Not an application to your internship');
  }
  res.json({ success: true, data: app });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!APPLICATION_STATUSES.includes(status)) throw new ApiError(400, `Invalid status. Allowed: ${APPLICATION_STATUSES.join(', ')}`);
  const app = await Application.findById(req.params.id);
  if (!app) throw new ApiError(404, 'Application not found');

  if (req.user.role === 'student') {
    if (String(app.studentId) !== String(req.user._id)) throw new ApiError(403, 'Not your application');
    if (status !== 'Withdrawn') throw new ApiError(403, 'Students can only withdraw their application');
    if (['Selected', 'Rejected', 'Withdrawn'].includes(app.status)) throw new ApiError(400, `Cannot withdraw an application that is already ${app.status}`);
  } else if (req.user.role === 'company') {
    const c = await Company.findOne({ userId: req.user._id });
    if (String(app.companyId) !== String(c?._id)) throw new ApiError(403, 'Not an application to your internship');
    if (!COMPANY_SETTABLE_STATUSES.includes(status)) throw new ApiError(400, 'Companies can set: ' + COMPANY_SETTABLE_STATUSES.join(', '));
    if (app.status === 'Withdrawn') throw new ApiError(400, 'The student has withdrawn this application');
  }
  if (app.status === status) throw new ApiError(400, `Application is already "${status}"`);
  app.status = status;
  app.statusHistory.push({ status, note: note || '', changedAt: new Date() });
  await app.save();

  if (req.user.role !== 'student') {
    const title = app.snapshot?.internshipTitle || 'your application';
    const type = status === 'Shortlisted' ? 'shortlisted' : status === 'Rejected' ? 'rejected' : 'application_update';
    await notify(app.studentId, {
      type, title: status === 'Shortlisted' ? 'You have been shortlisted!' : `Application ${status}`,
      message: `${app.snapshot?.companyName || 'The company'} updated "${title}" to ${status}.${note ? ` Note: ${note}` : ''}`, link: '/student/applications',
    });
  }
  res.json({ success: true, data: app });
});
