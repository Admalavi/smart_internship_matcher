const fs = require('fs');
const path = require('path');
const StudentProfile = require('../models/StudentProfile');
const SkillCatalog = require('../models/SkillCatalog');
const SavedInternship = require('../models/SavedInternship');
const ActivityHistory = require('../models/ActivityHistory');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const recService = require('../services/recommendationService');
const skillGap = require('../services/skillGapService');
const analytics = require('../services/analyticsService');
const { syncDeadlineAlerts } = require('../services/notificationService');
const Notification = require('../models/Notification');
const { PROFICIENCY_STRENGTH } = require('../utils/constants');
const { normalizeSkill } = require('../utils/skillUtils');

const getProfile = async (userId) => {
  let p = await StudentProfile.findOne({ userId });
  if (!p) p = await StudentProfile.create({ userId });
  return p;
};
const withCompletion = (p) => ({ ...p.toObject(), completionDetails: p.computeCompletion() });

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: withCompletion(await getProfile(req.user._id)) });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const p = await getProfile(req.user._id);
  const { education, preferences, interests, name, phone } = req.body;
  if (education) {
    if (education.cgpa !== undefined && education.cgpa !== '' && education.cgpa !== null && (Number(education.cgpa) < 0 || Number(education.cgpa) > 10)) throw new ApiError(400, 'CGPA must be between 0 and 10');
    ['degree', 'branch', 'college', 'graduationYear', 'cgpa'].forEach((k) => {
      if (education[k] === undefined) return;
      p.set(`education.${k}`, education[k] === '' || education[k] === null ? undefined : education[k]);
    });
  }
  if (preferences) {
    ['domains', 'locations', 'workModes', 'durationPreference', 'minStipend'].forEach((k) => { if (preferences[k] !== undefined) p.set(`preferences.${k}`, preferences[k] === '' ? undefined : preferences[k]); });
  }
  if (Array.isArray(interests)) p.interests = interests.map((s) => String(s).trim()).filter(Boolean);
  await p.save();
  if (name || phone !== undefined) await User.updateOne({ _id: req.user._id }, { $set: { ...(name && { name }), ...(phone !== undefined && { phone }) } });
  logActivity(req.user._id, 'profile_updated');
  res.json({ success: true, data: withCompletion(p) });
});

exports.addSkill = asyncHandler(async (req, res) => {
  const { name, category, proficiency, yearsOfExperience } = req.body;
  if (!name || !String(name).trim()) throw new ApiError(400, 'Skill name is required');
  const p = await getProfile(req.user._id);
  const key = normalizeSkill(name);
  if (p.skills.some((s) => normalizeSkill(s.name) === key)) throw new ApiError(409, `${name} is already in your skills`);
  const cat = category || (await SkillCatalog.findOne({ key }).lean())?.category || 'General';
  p.skills.push({ name: String(name).trim(), category: cat, proficiency: proficiency || 'Intermediate', yearsOfExperience: yearsOfExperience || 0 });
  await p.save();
  logActivity(req.user._id, 'skill_added', { meta: { name } });
  res.status(201).json({ success: true, data: withCompletion(p) });
});

exports.removeSkill = asyncHandler(async (req, res) => {
  const p = await getProfile(req.user._id);
  const skill = p.skills.id(req.params.id);
  if (!skill) throw new ApiError(404, 'Skill not found');
  logActivity(req.user._id, 'skill_removed', { meta: { name: skill.name } });
  skill.deleteOne();
  await p.save();
  res.json({ success: true, data: withCompletion(p) });
});

exports.addProject = asyncHandler(async (req, res) => {
  const { title, description, technologies, role, githubUrl } = req.body;
  if (!title) throw new ApiError(400, 'Project title is required');
  const techs = Array.isArray(technologies) ? technologies : String(technologies || '').split(',');
  const p = await getProfile(req.user._id);
  p.projects.push({ title, description, role, githubUrl, technologies: techs.map((t) => t.trim()).filter(Boolean) });
  await p.save();
  res.status(201).json({ success: true, data: withCompletion(p) });
});

exports.removeProject = asyncHandler(async (req, res) => {
  const p = await getProfile(req.user._id);
  const item = p.projects.id(req.params.id);
  if (!item) throw new ApiError(404, 'Project not found');
  item.deleteOne();
  await p.save();
  res.json({ success: true, data: withCompletion(p) });
});

exports.addCertification = asyncHandler(async (req, res) => {
  if (!req.body.name) throw new ApiError(400, 'Certification name is required');
  const p = await getProfile(req.user._id);
  p.certifications.push(req.body);
  await p.save();
  res.status(201).json({ success: true, data: withCompletion(p) });
});

exports.removeCertification = asyncHandler(async (req, res) => {
  const p = await getProfile(req.user._id);
  const item = p.certifications.id(req.params.id);
  if (!item) throw new ApiError(404, 'Certification not found');
  item.deleteOne();
  await p.save();
  res.json({ success: true, data: withCompletion(p) });
});

/* ---------- Resume upload + simple keyword parser (optional feature, no paid API) ---------- */
exports.uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Please attach a resume file');
  const p = await getProfile(req.user._id);
  p.resumeUrl = `/uploads/${req.file.filename}`;
  await p.save();
  res.json({ success: true, data: { resumeUrl: p.resumeUrl } });
});

/**
 * Extracts skills from plain text (uploaded .txt resume or pasted text) by matching against the skillCatalog.
 * PDF/DOCX binary parsing is intentionally not included (would need extra libraries) - paste text instead.
 */
exports.parseResume = asyncHandler(async (req, res) => {
  let text = req.body.text || '';
  if (!text && req.file && path.extname(req.file.originalname).toLowerCase() === '.txt') text = fs.readFileSync(req.file.path, 'utf8');
  if (req.file && !text) { fs.unlink(req.file.path, () => {}); }
  if (!text || text.trim().length < 20) throw new ApiError(400, 'Provide resume text (paste it or upload a .txt file). PDF/DOCX parsing is not supported - use manual entry or paste the text.');
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9.+#/ ]/g, ' ')} `;
  const catalog = await SkillCatalog.find().lean();
  const found = catalog.filter((c) => [c.name, ...(c.aliases || [])].some((n) => lower.includes(` ${n.toLowerCase()} `)));
  const cgpa = /cgpa[^0-9]{0,10}(\d(?:\.\d{1,2})?|10)/i.exec(text);
  const year = /(?:20)(2[4-9]|3[0-1])/.exec(text);
  const suggestions = {
    skills: found.map((c) => ({ name: c.name, category: c.category })),
    cgpa: cgpa ? Number(cgpa[1]) : null,
    graduationYear: year ? Number(`20${year[1]}`) : null,
  };
  if (req.body.apply === true || req.body.apply === 'true') {
    const p = await getProfile(req.user._id);
    const have = new Set(p.skills.map((s) => normalizeSkill(s.name)));
    suggestions.skills.forEach((s) => { if (!have.has(normalizeSkill(s.name))) p.skills.push({ name: s.name, category: s.category, proficiency: 'Intermediate' }); });
    if (suggestions.cgpa && p.education.cgpa == null) p.education.cgpa = suggestions.cgpa;
    if (suggestions.graduationYear && !p.education.graduationYear) p.education.graduationYear = suggestions.graduationYear;
    await p.save();
    logActivity(req.user._id, 'resume_parsed', { meta: { skills: suggestions.skills.length } });
  }
  res.json({ success: true, data: suggestions });
});

/* ---------- Dashboard (everything derived from MongoDB) ---------- */
exports.dashboard = asyncHandler(async (req, res) => {
  const profile = await getProfile(req.user._id);
  const completion = profile.computeCompletion();
  await syncDeadlineAlerts(req.user._id);
  let recs = [];
  if (profile.skills.length) recs = await recService.getForStudent(req.user._id, { limit: 12 });
  const eligibleRecs = recs.filter((r) => r.eligibility.status !== 'NOT_ELIGIBLE');
  const topRecs = eligibleRecs.slice(0, 6);
  const top5 = eligibleRecs.slice(0, 5);
  const avgTop = top5.length ? top5.reduce((a, r) => a + r.overallScore, 0) / top5.length : 0;
  const readiness = Math.round(0.6 * avgTop + 0.4 * profile.profileCompletion);

  const skillStrength = profile.skills
    .map((s) => ({ name: s.name, proficiency: s.proficiency, strength: Math.min(100, (PROFICIENCY_STRENGTH[s.proficiency] || 60) + Math.min(s.yearsOfExperience || 0, 3) * 2) }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);

  const [gaps, stats, unread, saved] = await Promise.all([
    profile.skills.length ? skillGap.aggregateForStudent(req.user._id, { top: 15, limit: 6 }) : [],
    analytics.studentStats(req.user._id),
    Notification.countDocuments({ userId: req.user._id, read: false }),
    SavedInternship.find({ studentId: req.user._id }).populate('internshipId', 'title applicationDeadline status').lean(),
  ]);
  const now = new Date();
  const deadlines = saved
    .map((s) => s.internshipId)
    .filter((i) => i && i.status === 'active' && new Date(i.applicationDeadline) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .map((i) => {
      const days = Math.ceil((new Date(i.applicationDeadline) - now) / 86400000);
      return { internshipId: i._id, title: i.title, deadline: i.applicationDeadline, daysLeft: days, level: days <= 0 ? 'today' : days <= 2 ? 'urgent' : days <= 7 ? 'soon' : 'later' };
    })
    .filter((d) => d.level !== 'later')
    .sort((a, b) => a.daysLeft - b.daysLeft);

  res.json({
    success: true,
    data: {
      name: req.user.name, readiness, profileCompletion: profile.profileCompletion, completionMissing: completion.missing,
      hasSkills: profile.skills.length > 0, topRecommendations: topRecs, skillStrength, topGaps: gaps, stats, unreadNotifications: unread, deadlines,
      totalRecommendations: recs.length,
    },
  });
});

exports.activity = asyncHandler(async (req, res) => {
  const items = await ActivityHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: items });
});
