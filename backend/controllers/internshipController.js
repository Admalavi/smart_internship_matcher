const Internship = require('../models/Internship');
const Company = require('../models/Company');
const Recommendation = require('../models/Recommendation');
const SavedInternship = require('../models/SavedInternship');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { validateInternship } = require('../validators/validators');
const { notifyAdmins } = require('../services/notificationService');
const recService = require('../services/recommendationService');
const skillGap = require('../services/skillGapService');
const { getEngine } = require('../services/engines');
const { logActivity } = require('../services/activityService');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toArr = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : String(v).split(',').map((s) => s.trim()).filter(Boolean));
const companyPopulate = { path: 'companyId', select: 'companyName logo location verified industry' };

/** Per-skill status for the internship card (matched / partial / missing) from a stored recommendation. */
const skillStatuses = (internship, rec) => {
  if (!rec) return null;
  const m = new Set(rec.matchedSkills.map((s) => s.name));
  const p = new Set(rec.partialSkills.map((s) => s.name));
  return internship.requiredSkills.map((s) => ({ name: s.name, importance: s.importance, status: m.has(s.name) ? 'matched' : p.has(s.name) ? 'partial' : 'missing' }));
};

exports.list = asyncHandler(async (req, res) => {
  const { q, domain, location, workMode, skills, minStipend, maxDuration, duration, sort = q ? 'relevance' : 'newest', excludeApplied, status, approvalStatus } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 12);
  const role = req.user?.role;
  const conds = [];

  if (role === 'admin') {
    if (status) conds.push({ status });
    if (approvalStatus) conds.push({ approvalStatus });
  } else {
    conds.push({ status: 'active', approvalStatus: 'approved' });
    if (req.query.includeExpired !== 'true') conds.push({ applicationDeadline: { $gte: new Date() } });
  }
  if (toArr(domain).length) conds.push({ domain: { $in: toArr(domain) } });
  if (toArr(location).length) conds.push({ location: { $in: toArr(location) } });
  if (toArr(workMode).length) conds.push({ workMode: { $in: toArr(workMode) } });
  if (toArr(skills).length) conds.push({ 'requiredSkills.name': { $in: toArr(skills).map((s) => new RegExp(`^${esc(s)}$`, 'i')) } });
  if (minStipend) conds.push({ 'stipend.max': { $exists: true, $gte: Number(minStipend) } });
  if (maxDuration) conds.push({ duration: { $lte: Number(maxDuration) } });
  if (duration) conds.push({ duration: Number(duration) });
  if (role === 'student' && excludeApplied === 'true') {
    const applied = await Application.find({ studentId: req.user._id }).distinct('internshipId');
    conds.push({ _id: { $nin: applied } });
  }

  const build = (extra) => ({ $and: [...conds, ...(extra ? [extra] : [])] });
  const textQ = q && q.trim() ? { $text: { $search: q.trim() } } : null;
  let filter = build(textQ);
  let usedText = !!textQ;
  const sortMap = { newest: { createdAt: -1 }, deadline: { applicationDeadline: 1 }, stipend: { 'stipend.max': -1, createdAt: -1 } };

  // Text index search first; fall back to $regex ($or) for partial words not covered by stemming.
  const runCount = (f) => Internship.countDocuments(f.$and.length ? f : {});
  let total = await runCount(filter);
  if (textQ && total === 0) {
    const rx = new RegExp(esc(q.trim()), 'i');
    filter = build({ $or: [{ title: rx }, { domain: rx }, { tags: rx }, { 'requiredSkills.name': rx }, { location: rx }] });
    usedText = false;
    total = await runCount(filter);
  }
  const f = filter.$and.length ? filter : {};

  const isStudent = role === 'student';
  if (isStudent) {
    const hasProfile = await StudentProfile.exists({ userId: req.user._id });
    if (hasProfile) await recService.ensureFresh(req.user._id).catch(() => null);
  }

  let items;
  if (sort === 'match' && isStudent) {
    const all = await Internship.find(f).limit(500).populate(companyPopulate).lean();
    const recs = await Recommendation.find({ studentId: req.user._id, internshipId: { $in: all.map((i) => i._id) } }).lean();
    const rm = new Map(recs.map((r) => [String(r.internshipId), r]));
    all.forEach((i) => { i._rec = rm.get(String(i._id)); });
    all.sort((a, b) => (b._rec?.overallScore ?? -1) - (a._rec?.overallScore ?? -1));
    items = all.slice((page - 1) * limit, page * limit);
  } else {
    let query = Internship.find(f, usedText ? { score: { $meta: 'textScore' } } : undefined).populate(companyPopulate);
    query = usedText && sort === 'relevance' ? query.sort({ score: { $meta: 'textScore' } }) : query.sort(sortMap[sort] || sortMap.newest);
    items = await query.skip((page - 1) * limit).limit(limit).lean();
    if (isStudent && items.length) {
      const recs = await Recommendation.find({ studentId: req.user._id, internshipId: { $in: items.map((i) => i._id) } }).lean();
      const rm = new Map(recs.map((r) => [String(r.internshipId), r]));
      items.forEach((i) => { i._rec = rm.get(String(i._id)); });
    }
  }

  let savedSet = new Set();
  let appliedSet = new Set();
  if (isStudent && items.length) {
    const ids = items.map((i) => i._id);
    const [saved, applied] = await Promise.all([
      SavedInternship.find({ studentId: req.user._id, internshipId: { $in: ids } }).select('internshipId').lean(),
      Application.find({ studentId: req.user._id, internshipId: { $in: ids } }).select('internshipId').lean(),
    ]);
    savedSet = new Set(saved.map((s) => String(s.internshipId)));
    appliedSet = new Set(applied.map((s) => String(s.internshipId)));
  }
  const data = items.map(({ _rec, score, ...i }) => ({
    ...i,
    matchScore: _rec ? _rec.overallScore : null,
    eligibilityStatus: _rec ? _rec.eligibility.status : null,
    skillStatuses: skillStatuses(i, _rec),
    saved: savedSet.has(String(i._id)),
    applied: appliedSet.has(String(i._id)),
  }));
  res.json({ success: true, data, meta: { total, page, pages: Math.ceil(total / limit) || 1, limit, searchMode: q ? (usedText ? 'text-index' : 'regex-fallback') : null } });
});

exports.facets = asyncHandler(async (_req, res) => {
  const base = { status: 'active', approvalStatus: 'approved', applicationDeadline: { $gte: new Date() } };
  const [domains, locations, workModes] = await Promise.all([
    Internship.distinct('domain', base), Internship.distinct('location', base), Internship.distinct('workMode', base),
  ]);
  res.json({ success: true, data: { domains: domains.sort(), locations: locations.sort(), workModes } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.id).populate(companyPopulate).lean();
  if (!internship) throw new ApiError(404, 'Internship not found');
  const role = req.user?.role;
  const isOwner = role === 'company' && (await Company.exists({ _id: internship.companyId._id, userId: req.user._id }));
  if (internship.approvalStatus !== 'approved' && role !== 'admin' && !isOwner) throw new ApiError(404, 'Internship not found');

  let compatibility = null;
  let saved = false;
  let application = null;
  if (role === 'student') {
    const profile = await StudentProfile.findOne({ userId: req.user._id });
    if (profile) {
      const match = getEngine().score(profile, internship); // computed live from current profile
      const learningMap = await skillGap.getLearningMap([...match.missingSkills, ...match.partialSkills].map((s) => s.name));
      compatibility = { ...match, gap: skillGap.buildGap(match, learningMap) };
    }
    [saved, application] = await Promise.all([
      SavedInternship.exists({ studentId: req.user._id, internshipId: internship._id }),
      Application.findOne({ studentId: req.user._id, internshipId: internship._id }).select('status appliedAt').lean(),
    ]);
    logActivity(req.user._id, 'internship_viewed', { entityType: 'internship', entityId: internship._id, meta: { title: internship.title, domain: internship.domain } });
  }
  const expired = new Date(internship.applicationDeadline) < new Date();
  res.json({ success: true, data: { ...internship, expired, compatibility, saved: !!saved, application } });
});

const getCompany = async (userId) => {
  const c = await Company.findOne({ userId });
  if (!c) throw new ApiError(404, 'Company profile not found');
  return c;
};

const clean = (b) => {
  const out = { ...b };
  delete out.companyId; delete out.approvalStatus; delete out._id;
  if (out.requiredSkills) out.requiredSkills = out.requiredSkills.filter((s) => s.name && s.name.trim()).map((s) => ({ name: s.name.trim(), importance: s.importance || 'Medium' }));
  ['preferredSkills', 'tags', 'responsibilities', 'benefits'].forEach((k) => { if (out[k] !== undefined) out[k] = toArr(out[k]); });
  if (out.eligibility?.branches) out.eligibility.branches = toArr(out.eligibility.branches);
  if (out.eligibility?.graduationYears) out.eligibility.graduationYears = toArr(out.eligibility.graduationYears).map(Number);
  return out;
};

exports.create = asyncHandler(async (req, res) => {
  validateInternship(req.body);
  const company = await getCompany(req.user._id);
  const internship = await Internship.create({ ...clean(req.body), companyId: company._id, approvalStatus: 'pending' });
  await notifyAdmins({ type: 'internship_pending', title: 'Internship awaiting approval', message: `${company.companyName} posted "${internship.title}".`, link: '/admin/internships' });
  res.status(201).json({ success: true, data: internship, message: 'Internship submitted for admin approval' });
});

const loadOwned = async (req) => {
  const internship = await Internship.findById(req.params.id);
  if (!internship) throw new ApiError(404, 'Internship not found');
  if (req.user.role !== 'admin') {
    const company = await getCompany(req.user._id);
    if (String(internship.companyId) !== String(company._id)) throw new ApiError(403, 'You can only manage your own internships');
  }
  return internship;
};

exports.update = asyncHandler(async (req, res) => {
  validateInternship(req.body, { partial: true });
  const internship = await loadOwned(req);
  Object.assign(internship, clean(req.body));
  if (req.body.status && ['active', 'closed'].includes(req.body.status)) internship.status = req.body.status;
  if (req.user.role === 'company' && internship.approvalStatus === 'rejected') internship.approvalStatus = 'pending';
  await internship.save();
  res.json({ success: true, data: internship });
});

exports.remove = asyncHandler(async (req, res) => {
  const internship = await loadOwned(req);
  await Internship.deleteOne({ _id: internship._id });
  await Promise.all([
    Recommendation.deleteMany({ internshipId: internship._id }),
    SavedInternship.deleteMany({ internshipId: internship._id }),
  ]); // applications are kept: they hold an embedded snapshot of the internship title
  res.json({ success: true, message: 'Internship deleted' });
});
