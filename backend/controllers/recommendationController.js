const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const recService = require('../services/recommendationService');
const skillGap = require('../services/skillGapService');
const StudentProfile = require('../models/StudentProfile');
const ActivityHistory = require('../models/ActivityHistory');
const Internship = require('../models/Internship');
const { getEngine } = require('../services/engines');
const { logActivity } = require('../services/activityService');

exports.list = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ userId: req.user._id }).select('skills updatedAt').lean();
  if (!profile) throw new ApiError(404, 'Student profile not found');
  if (profile.skills.length < 3) {
    return res.json({ success: true, data: [], meta: { reason: 'INSUFFICIENT_PROFILE', message: 'Add at least 3 technical skills to receive personalized recommendations.' } });
  }
  const data = await recService.getForStudent(req.user._id, { minScore: req.query.minScore || 0, limit: req.query.limit || 50, refresh: req.query.refresh === 'true' });
  logActivity(req.user._id, 'recommendation_viewed');
  const latest = data.length ? data.reduce((m, r) => (r.generatedAt > m ? r.generatedAt : m), data[0].generatedAt) : null;
  res.json({ success: true, data, meta: { count: data.length, generatedAt: latest, engine: getEngine().name } });
});

exports.generate = asyncHandler(async (req, res) => {
  const result = await recService.generateForStudent(req.user._id);
  res.json({ success: true, data: result, message: `Generated ${result.generated} recommendations` });
});

exports.getOne = asyncHandler(async (req, res) => {
  let rec = await recService.getOne(req.user._id, req.params.internshipId);
  if (!rec) {
    // not cached (e.g. just-created internship): compute live for this internship
    const [profile, internship] = await Promise.all([StudentProfile.findOne({ userId: req.user._id }), Internship.findById(req.params.internshipId).populate('companyId', 'companyName logo')]);
    if (!profile) throw new ApiError(404, 'Student profile not found');
    if (!internship) throw new ApiError(404, 'Internship not found');
    rec = { ...getEngine().score(profile, internship), internship, internshipId: internship._id, generatedAt: new Date(), live: true };
  }
  const learningMap = await skillGap.getLearningMap([...rec.missingSkills, ...rec.partialSkills].map((s) => s.name));
  res.json({ success: true, data: { ...rec, gap: skillGap.buildGap(rec, learningMap) } });
});

exports.history = asyncHandler(async (req, res) => {
  const items = await ActivityHistory.find({ userId: req.user._id, action: 'recommendations_generated' }).sort({ createdAt: -1 }).limit(30).lean();
  res.json({ success: true, data: items });
});
