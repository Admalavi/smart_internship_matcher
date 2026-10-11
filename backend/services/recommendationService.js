const Recommendation = require('../models/Recommendation');
const Internship = require('../models/Internship');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const { getEngine } = require('./engines');
const { withSeverity } = require('./skillGapService');
const { notify } = require('./notificationService');
const { logActivity } = require('./activityService');
const { HIGH_MATCH_THRESHOLD } = require('../utils/constants');

const activeFilter = () => ({ status: 'active', approvalStatus: 'approved', applicationDeadline: { $gte: new Date() } });

/** Shape a computeMatch() result into a Recommendation document. */
const toDoc = (studentId, internshipId, m, engineName, now) => ({
  studentId, internshipId,
  overallScore: m.overallScore,
  scores: m.scores,
  skillMatchPercentage: m.skillMatchPercentage,
  matchedSkills: m.matchedSkills,
  partialSkills: m.partialSkills,
  missingSkills: withSeverity(m.missingSkills),
  eligibility: { status: m.eligibility.status, reasons: m.eligibility.reasons },
  confidence: m.confidence,
  explanation: m.explanation,
  engine: engineName,
  generatedAt: now,
});

/**
 * (Re)generates and stores recommendations for every open internship.
 * Results are cached in the `recommendations` collection (upserted by studentId+internshipId).
 */
async function generateForStudent(userId, { notifyNew = true } = {}) {
  const profile = await StudentProfile.findOne({ userId });
  if (!profile) throw new ApiError(404, 'Student profile not found. Please complete your profile first.');
  const plainProfile = profile.toObject();
  const [internships, existing] = await Promise.all([
    Internship.find(activeFilter()).lean(),
    Recommendation.find({ studentId: userId }).select('internshipId').lean(),
  ]);
  const existingSet = new Set(existing.map((e) => String(e.internshipId)));
  const engine = getEngine();
  const now = new Date();

  const docs = internships.map((i) => toDoc(userId, i._id, engine.score(plainProfile, i), engine.name, now));
  if (docs.length) {
    await Recommendation.bulkWrite(
      docs.map((d) => ({ updateOne: { filter: { studentId: d.studentId, internshipId: d.internshipId }, update: { $set: d }, upsert: true } }))
    );
  }
  // drop recommendations for internships that are closed / expired / removed
  await Recommendation.deleteMany({ studentId: userId, internshipId: { $nin: internships.map((i) => i._id) } });

  const scores = docs.map((d) => d.overallScore);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  logActivity(userId, 'recommendations_generated', { meta: { count: docs.length, top: Math.max(0, ...scores), average: avg, engine: engine.name } });

  if (notifyNew && plainProfile.skills.length >= 3) {
    const byId = new Map(internships.map((i) => [String(i._id), i]));
    const fresh = docs
      .filter((d) => d.overallScore >= HIGH_MATCH_THRESHOLD && d.eligibility.status !== 'NOT_ELIGIBLE' && !existingSet.has(String(d.internshipId)))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 3);
    for (const d of fresh) {
      const i = byId.get(String(d.internshipId));
      const days = Math.max(0, Math.ceil((new Date(i.applicationDeadline) - now) / 86400000));
      await notify(userId, {
        type: 'new_recommendation',
        title: 'New Opportunity',
        message: `"${i.title}" matches ${d.overallScore}% of your profile. Deadline: ${days} day${days === 1 ? '' : 's'}.`,
        link: `/internships/${i._id}`,
        dedupeKey: `rec:${i._id}`,
      });
    }
  }
  return { generated: docs.length, average: avg, generatedAt: now };
}

/** True when the cached recommendations are older than the profile or any internship change. */
async function isStale(userId) {
  const [profile, latestRec, latestInternship] = await Promise.all([
    StudentProfile.findOne({ userId }).select('updatedAt').lean(),
    Recommendation.findOne({ studentId: userId }).sort({ generatedAt: -1 }).select('generatedAt').lean(),
    Internship.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
  ]);
  if (!profile) return false;
  if (!latestRec) return true;
  return profile.updatedAt > latestRec.generatedAt || (latestInternship && latestInternship.updatedAt > latestRec.generatedAt);
}

async function ensureFresh(userId, force = false) {
  if (force || (await isStale(userId))) return generateForStudent(userId);
  return null;
}

const populateInternship = {
  path: 'internshipId',
  populate: { path: 'companyId', select: 'companyName logo location verified' },
};

const shape = (r) => {
  const { internshipId: internship, ...rest } = r;
  return { ...rest, internshipId: internship?._id, internship };
};

async function getForStudent(userId, { minScore = 0, limit = 50, refresh = false } = {}) {
  const profile = await StudentProfile.findOne({ userId }).select('_id').lean();
  if (!profile) throw new ApiError(404, 'Student profile not found. Please complete your profile first.');
  await ensureFresh(userId, refresh);
  const recs = await Recommendation.find({ studentId: userId, overallScore: { $gte: Number(minScore) } })
    .sort({ overallScore: -1 })
    .limit(Number(limit))
    .populate(populateInternship)
    .lean();
  const now = new Date();
  return recs
    .filter((r) => r.internshipId && r.internshipId.status === 'active' && new Date(r.internshipId.applicationDeadline) >= now)
    .map(shape);
}

async function getOne(userId, internshipId) {
  await ensureFresh(userId);
  const rec = await Recommendation.findOne({ studentId: userId, internshipId }).populate(populateInternship).lean();
  return rec ? shape(rec) : null;
}

/** Bulk regeneration when a new internship is approved (cheap: one internship x all students). */
async function scoreInternshipForAllStudents(internship) {
  const profiles = await StudentProfile.find({ 'skills.0': { $exists: true } }).lean();
  const engine = getEngine();
  const now = new Date();
  const ops = profiles.map((p) => {
    const d = toDoc(p.userId, internship._id, engine.score(p, internship), engine.name, now);
    return { updateOne: { filter: { studentId: d.studentId, internshipId: d.internshipId }, update: { $set: d }, upsert: true } };
  });
  if (ops.length) await Recommendation.bulkWrite(ops);
  return ops.length;
}

module.exports = { generateForStudent, getForStudent, getOne, ensureFresh, isStale, scoreInternshipForAllStudents, activeFilter, toDoc };
