const User = require('../models/User');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const Recommendation = require('../models/Recommendation');
const SavedInternship = require('../models/SavedInternship');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const analytics = require('../services/analyticsService');
const { notify } = require('../services/notificationService');
const recService = require('../services/recommendationService');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const paging = (req) => ({ page: Math.max(1, parseInt(req.query.page, 10) || 1), limit: Math.min(100, parseInt(req.query.limit, 10) || 20) });

exports.dashboard = asyncHandler(async (_req, res) => {
  const [overview, statuses, domains] = await Promise.all([analytics.adminOverview(), analytics.applicationsByStatus(), analytics.internshipsByDomain()]);
  res.json({ success: true, data: { ...overview, applicationsByStatus: statuses, internshipsByDomain: domains } });
});

exports.analytics = asyncHandler(async (_req, res) => res.json({ success: true, data: await analytics.adminAnalytics() }));

exports.users = asyncHandler(async (req, res) => {
  const { page, limit } = paging(req);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.active === 'true' || req.query.active === 'false') filter.isActive = req.query.active === 'true';
  if (req.query.q) { const rx = new RegExp(esc(req.query.q), 'i'); filter.$or = [{ name: rx }, { email: rx }]; }
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  const ids = data.filter((u) => u.role === 'student').map((u) => u._id);
  const profiles = await StudentProfile.find({ userId: { $in: ids } }).select('userId education skills profileCompletion').lean();
  const pm = new Map(profiles.map((p) => [String(p.userId), p]));
  res.json({ success: true, data: data.map((u) => ({ ...u, password: undefined, profile: pm.get(String(u._id)) ? { college: pm.get(String(u._id)).education?.college, cgpa: pm.get(String(u._id)).education?.cgpa, skills: pm.get(String(u._id)).skills.length, completion: pm.get(String(u._id)).profileCompletion } : undefined })), meta: { total, page, pages: Math.ceil(total / limit) || 1 } });
});

exports.setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deactivated here');
  const r = await User.updateOne({ _id: user._id }, { $set: { isActive: !!req.body.isActive } });
  res.json({ success: true, data: { modified: r.modifiedCount, isActive: !!req.body.isActive } });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deleted');
  if (user.role === 'student') {
    await Promise.all([StudentProfile.deleteOne({ userId: user._id }), Recommendation.deleteMany({ studentId: user._id }), SavedInternship.deleteMany({ studentId: user._id }), Application.deleteMany({ studentId: user._id }), Notification.deleteMany({ userId: user._id })]);
  } else if (user.role === 'company') {
    const c = await Company.findOne({ userId: user._id });
    if (c) { await Internship.updateMany({ companyId: c._id }, { $set: { status: 'closed' } }); await Company.deleteOne({ _id: c._id }); }
  }
  await User.deleteOne({ _id: user._id });
  res.json({ success: true, message: 'User removed' });
});

exports.companies = asyncHandler(async (req, res) => {
  const filter = req.query.verified === 'true' || req.query.verified === 'false' ? { verified: req.query.verified === 'true' } : {};
  if (req.query.q) filter.companyName = new RegExp(esc(req.query.q), 'i');
  const [companies, counts] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email isActive').lean(),
    Internship.aggregate([{ $group: { _id: '$companyId', internships: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } }]),
  ]);
  const cm = new Map(counts.map((c) => [String(c._id), c]));
  res.json({ success: true, data: companies.map((c) => ({ ...c, internships: cm.get(String(c._id))?.internships || 0, activeInternships: cm.get(String(c._id))?.active || 0 })) });
});

exports.verifyCompany = asyncHandler(async (req, res) => {
  const r = await Company.updateOne({ _id: req.params.id }, { $set: { verified: !!req.body.verified } });
  if (!r.matchedCount) throw new ApiError(404, 'Company not found');
  res.json({ success: true, message: req.body.verified ? 'Company verified' : 'Verification removed' });
});

exports.internships = asyncHandler(async (req, res) => {
  const { page, limit } = paging(req);
  const filter = {};
  if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) { const rx = new RegExp(esc(req.query.q), 'i'); filter.$or = [{ title: rx }, { domain: rx }]; }
  const [data, total] = await Promise.all([
    Internship.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('companyId', 'companyName verified').lean(),
    Internship.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: { total, page, pages: Math.ceil(total / limit) || 1 } });
});

exports.setApproval = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) throw new ApiError(400, 'status must be approved, rejected or pending');
  const internship = await Internship.findById(req.params.id).populate('companyId');
  if (!internship) throw new ApiError(404, 'Internship not found');
  internship.approvalStatus = status;
  await internship.save();
  if (status === 'approved') await recService.scoreInternshipForAllStudents(internship);
  if (status !== 'pending') {
    await notify(internship.companyId.userId, {
      type: 'internship_approval', title: status === 'approved' ? 'Internship approved' : 'Internship rejected',
      message: `"${internship.title}" was ${status}.${note ? ` Note: ${note}` : ''}`, link: '/company/internships',
    });
  }
  res.json({ success: true, data: internship });
});

exports.applications = asyncHandler(async (req, res) => {
  const { page, limit } = paging(req);
  const filter = req.query.status ? { status: req.query.status } : {};
  const [data, total] = await Promise.all([
    Application.find(filter).sort({ appliedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('studentId', 'name email').populate('internshipId', 'title').lean(),
    Application.countDocuments(filter),
  ]);
  res.json({ success: true, data, meta: { total, page, pages: Math.ceil(total / limit) || 1 } });
});
