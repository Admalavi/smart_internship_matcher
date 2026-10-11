const LearningResource = require('../models/LearningResource');
const Recommendation = require('../models/Recommendation');
const mongoose = require('mongoose');
const { normalizeSkill } = require('../utils/skillUtils');

const SEVERITY = { High: 'Critical', Medium: 'Moderate', Low: 'Minor' };
const DOWNGRADE = { Critical: 'Moderate', Moderate: 'Minor', Minor: 'Minor' };

/** Severity for a MISSING skill from its importance. */
const severityFor = (importance) => SEVERITY[importance] || 'Moderate';

/** Attach severity to match.missingSkills (used when persisting recommendations). */
const withSeverity = (missing) => missing.map((m) => ({ ...m, key: m.key || normalizeSkill(m.name), severity: severityFor(m.importance) }));

/**
 * Required - Student = Gap. Classifies into Critical / Moderate / Minor.
 * Partially matched skills are listed as gaps one level less severe (the student only has a related skill).
 */
function buildGap(match, learningMap = {}) {
  const items = [];
  withSeverity(match.missingSkills).forEach((m) => {
    items.push({ skill: m.name, importance: m.importance, severity: m.severity, type: 'missing', learning: learningMap[normalizeSkill(m.name)] || null });
  });
  (match.partialSkills || []).forEach((p) => {
    items.push({
      skill: p.name, importance: p.importance, severity: DOWNGRADE[severityFor(p.importance)], type: 'partial', via: p.via,
      learning: learningMap[normalizeSkill(p.name)] || null,
    });
  });
  const order = { Critical: 0, Moderate: 1, Minor: 2 };
  items.sort((a, b) => order[a.severity] - order[b.severity] || (a.type === 'missing' ? -1 : 1));
  const by = (s) => items.filter((i) => i.severity === s).map((i) => i.skill);
  return { critical: by('Critical'), moderate: by('Moderate'), minor: by('Minor'), items, totalGaps: items.length };
}

const getLearningMap = async (skillNames) => {
  const keys = [...new Set(skillNames.map(normalizeSkill))];
  if (!keys.length) return {};
  const docs = await LearningResource.find({ skillKey: { $in: keys } }).lean();
  return docs.reduce((acc, d) => { acc[d.skillKey] = d; return acc; }, {});
};

/** Aggregated gaps over a student's top recommendations. Uses $sort/$limit/$unwind/$group/$lookup. */
async function aggregateForStudent(studentId, { top = 20, limit = 12 } = {}) {
  return Recommendation.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), 'eligibility.status': { $ne: 'NOT_ELIGIBLE' } } },
    { $sort: { overallScore: -1 } },
    { $limit: top },
    { $unwind: '$missingSkills' },
    { $group: { _id: '$missingSkills.key', skill: { $first: '$missingSkills.name' }, internships: { $sum: 1 }, highestSeverity: { $min: { $switch: { branches: [
      { case: { $eq: ['$missingSkills.severity', 'Critical'] }, then: 0 },
      { case: { $eq: ['$missingSkills.severity', 'Moderate'] }, then: 1 },
    ], default: 2 } } } } },
    { $sort: { highestSeverity: 1, internships: -1 } },
    { $limit: limit },
    { $lookup: { from: 'learningresources', localField: '_id', foreignField: 'skillKey', as: 'learning' } },
    { $unwind: { path: '$learning', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, key: '$_id', skill: 1, internships: 1,
      severity: { $arrayElemAt: [['Critical', 'Moderate', 'Minor'], '$highestSeverity'] },
      learning: { steps: '$learning.steps', resources: '$learning.resources', estimatedHours: '$learning.estimatedHours' } } },
  ]);
}

module.exports = { buildGap, getLearningMap, aggregateForStudent, withSeverity, severityFor };
