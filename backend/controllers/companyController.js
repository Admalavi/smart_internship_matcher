const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const analytics = require('../services/analyticsService');
const { getEngine } = require('../services/engines');

const getCompany = async (userId) => {
  const c = await Company.findOne({ userId });
  if (!c) throw new ApiError(404, 'Company profile not found');
  return c;
};

exports.getProfile = asyncHandler(async (req, res) => res.json({ success: true, data: await getCompany(req.user._id) }));

exports.updateProfile = asyncHandler(async (req, res) => {
  const c = await getCompany(req.user._id);
  ['companyName', 'description', 'industry', 'website', 'location', 'companySize'].forEach((k) => { if (req.body[k] !== undefined) c[k] = req.body[k]; });
  if (!c.companyName) throw new ApiError(400, 'Company name is required');
  await c.save();
  res.json({ success: true, data: c });
});

exports.uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please attach an image');
  const c = await getCompany(req.user._id);
  c.logo = `/uploads/${req.file.filename}`;
  await c.save();
  res.json({ success: true, data: { logo: c.logo } });
});

exports.internships = asyncHandler(async (req, res) => {
  const c = await getCompany(req.user._id);
  const items = await Internship.find({ companyId: c._id }).sort({ createdAt: -1 }).lean();
  const counts = await Application.aggregate([{ $match: { companyId: c._id } }, { $group: { _id: '$internshipId', applications: { $sum: 1 } } }]);
  const cm = new Map(counts.map((x) => [String(x._id), x.applications]));
  res.json({ success: true, data: items.map((i) => ({ ...i, applicationCount: cm.get(String(i._id)) || 0 })) });
});

exports.applications = asyncHandler(async (req, res) => {
  const c = await getCompany(req.user._id);
  const filter = { companyId: c._id };
  if (req.query.internshipId) filter.internshipId = req.query.internshipId;
  if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };
  if (req.query.minScore) filter.matchScore = { $gte: Number(req.query.minScore) };
  const apps = await Application.find(filter).sort({ matchScore: -1, appliedAt: -1 })
    .populate('studentId', 'name email phone').populate('internshipId', 'title').lean();
  res.json({ success: true, data: apps });
});

/** Candidate details: application + profile + live compatibility against the internship. */
exports.candidate = asyncHandler(async (req, res) => {
  const c = await getCompany(req.user._id);
  const app = await Application.findOne({ _id: req.params.id, companyId: c._id }).populate('studentId', 'name email phone').lean();
  if (!app) throw new ApiError(404, 'Application not found');
  const [profile, internship] = await Promise.all([
    StudentProfile.findOne({ userId: app.studentId._id }).lean(),
    Internship.findById(app.internshipId).lean(),
  ]);
  const compatibility = profile && internship ? getEngine().score(profile, internship) : null;
  res.json({ success: true, data: { application: app, profile, internship, compatibility } });
});

exports.dashboard = asyncHandler(async (req, res) => {
  const c = await getCompany(req.user._id);
  const stats = await analytics.companyStats(c._id);
  const pending = await Internship.countDocuments({ companyId: c._id, approvalStatus: 'pending' });
  res.json({ success: true, data: { company: c, ...stats, pendingApproval: pending } });
});
