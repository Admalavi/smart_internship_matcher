const SavedInternship = require('../models/SavedInternship');
const Internship = require('../models/Internship');
const Recommendation = require('../models/Recommendation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');

exports.save = asyncHandler(async (req, res) => {
  const internship = await Internship.findById(req.params.internshipId).select('title approvalStatus');
  if (!internship || internship.approvalStatus !== 'approved') throw new ApiError(404, 'Internship not found');
  await SavedInternship.updateOne({ studentId: req.user._id, internshipId: internship._id }, { $setOnInsert: { savedAt: new Date() } }, { upsert: true });
  logActivity(req.user._id, 'internship_saved', { entityType: 'internship', entityId: internship._id, meta: { title: internship.title } });
  res.status(201).json({ success: true, message: 'Internship saved' });
});

exports.unsave = asyncHandler(async (req, res) => {
  const r = await SavedInternship.deleteOne({ studentId: req.user._id, internshipId: req.params.internshipId });
  if (!r.deletedCount) throw new ApiError(404, 'Internship was not in your saved list');
  logActivity(req.user._id, 'internship_unsaved', { entityType: 'internship', entityId: req.params.internshipId });
  res.json({ success: true, message: 'Removed from saved' });
});

exports.list = asyncHandler(async (req, res) => {
  const saved = await SavedInternship.find({ studentId: req.user._id }).sort({ savedAt: -1 })
    .populate({ path: 'internshipId', populate: { path: 'companyId', select: 'companyName logo' } }).lean();
  const valid = saved.filter((s) => s.internshipId);
  const recs = await Recommendation.find({ studentId: req.user._id, internshipId: { $in: valid.map((s) => s.internshipId._id) } }).select('internshipId overallScore eligibility.status').lean();
  const rm = new Map(recs.map((r) => [String(r.internshipId), r]));
  res.json({ success: true, data: valid.map((s) => ({ savedAt: s.savedAt, internship: { ...s.internshipId, matchScore: rm.get(String(s.internshipId._id))?.overallScore ?? null, saved: true } })) });
});
