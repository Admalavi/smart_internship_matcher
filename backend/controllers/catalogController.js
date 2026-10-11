const SkillCatalog = require('../models/SkillCatalog');
const LearningResource = require('../models/LearningResource');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeSkill } = require('../utils/skillUtils');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.skills = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) filter.name = new RegExp(esc(req.query.q), 'i');
  if (req.query.category) filter.category = req.query.category;
  const data = await SkillCatalog.find(filter).sort({ category: 1, name: 1 }).limit(100).lean();
  res.json({ success: true, data });
});

exports.learning = asyncHandler(async (req, res) => {
  const doc = await LearningResource.findOne({ skillKey: normalizeSkill(req.params.skill) }).lean();
  res.json({ success: true, data: doc });
});

/** Public landing-page statistics + featured internships (all from MongoDB). */
exports.publicStats = asyncHandler(async (_req, res) => {
  const User = require('../models/User');
  const Internship = require('../models/Internship');
  const Application = require('../models/Application');
  const Company = require('../models/Company');
  const live = { status: 'active', approvalStatus: 'approved', applicationDeadline: { $gte: new Date() } };
  const [students, companies, internships, applications, skills, featured] = await Promise.all([
    User.countDocuments({ role: 'student' }), Company.countDocuments(), Internship.countDocuments(live), Application.countDocuments(),
    SkillCatalog.countDocuments(),
    Internship.find(live).sort({ 'stipend.max': -1 }).limit(6).populate('companyId', 'companyName logo').lean(),
  ]);
  res.json({ success: true, data: { students, companies, internships, applications, skills, featured } });
});
