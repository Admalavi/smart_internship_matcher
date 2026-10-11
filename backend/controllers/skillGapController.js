const asyncHandler = require('../utils/asyncHandler');
const skillGap = require('../services/skillGapService');
const recService = require('../services/recommendationService');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');

/** Aggregated skill gaps across the student's best recommendations (with learning paths via $lookup). */
exports.overview = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ userId: req.user._id }).select('skills').lean();
  if (!profile) throw new ApiError(404, 'Student profile not found');
  await recService.ensureFresh(req.user._id);
  const gaps = await skillGap.aggregateForStudent(req.user._id, { top: Number(req.query.top) || 20, limit: 15 });
  res.json({ success: true, data: gaps });
});

exports.forInternship = asyncHandler(async (req, res) => {
  const rec = await recService.getOne(req.user._id, req.params.internshipId);
  if (!rec) throw new ApiError(404, 'No recommendation found for this internship');
  const learningMap = await skillGap.getLearningMap([...rec.missingSkills, ...rec.partialSkills].map((s) => s.name));
  res.json({ success: true, data: { internship: rec.internship, overallScore: rec.overallScore, ...skillGap.buildGap(rec, learningMap) } });
});
