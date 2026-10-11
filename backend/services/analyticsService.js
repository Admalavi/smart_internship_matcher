/** All statistics shown in the UI are produced here with MongoDB aggregation pipelines. */
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Recommendation = require('../models/Recommendation');
const StudentProfile = require('../models/StudentProfile');

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const LIVE = { approvalStatus: 'approved' };
const top = (arr, k = 'count') => (arr && arr.length ? arr[0] : null);

/* ---- Admin: cards ---- */
async function adminOverview() {
  const [students, companies, activeInternships, applications, selected, pending, recStats] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'company' }),
    Internship.countDocuments({ ...LIVE, status: 'active', applicationDeadline: { $gte: new Date() } }),
    Application.countDocuments(),
    Application.countDocuments({ status: 'Selected' }),
    Internship.countDocuments({ approvalStatus: 'pending' }),
    Recommendation.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' }, total: { $sum: 1 } } }]),
  ]);
  return {
    totalStudents: students, totalCompanies: companies, activeInternships, totalApplications: applications,
    successfulPlacements: selected, pendingApprovals: pending,
    averageMatchScore: recStats[0] ? Math.round(recStats[0].avg) : 0,
    totalRecommendations: recStats[0] ? recStats[0].total : 0,
  };
}

/* ---- Chart pipelines ---- */
const skillDemand = (limit = 10) => Internship.aggregate([
  { $match: LIVE }, { $unwind: '$requiredSkills' },
  { $group: { _id: '$requiredSkills.name', count: { $sum: 1 }, highImportance: { $sum: { $cond: [{ $eq: ['$requiredSkills.importance', 'High'] }, 1, 0] } } } },
  { $sort: { count: -1, _id: 1 } }, { $limit: limit },
  { $project: { _id: 0, name: '$_id', count: 1, highImportance: 1 } },
]);

const internshipsByDomain = () => Internship.aggregate([
  { $match: LIVE }, { $group: { _id: '$domain', count: { $sum: 1 } } }, { $sort: { count: -1 } },
  { $project: { _id: 0, name: '$_id', count: 1 } },
]);

const popularLocations = () => Internship.aggregate([
  { $match: LIVE }, { $group: { _id: '$location', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 },
  { $project: { _id: 0, name: '$_id', count: 1 } },
]);

const byWorkMode = () => Internship.aggregate([
  { $match: LIVE }, { $group: { _id: '$workMode', count: { $sum: 1 } } }, { $sort: { count: -1 } },
  { $project: { _id: 0, name: '$_id', count: 1 } },
]);

const applicationsByStatus = (match = {}) => Application.aggregate([
  { $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } },
  { $project: { _id: 0, name: '$_id', count: 1 } },
]);

const monthlyApplications = (months = 12) => {
  const from = new Date(); from.setMonth(from.getMonth() - months + 1, 1); from.setHours(0, 0, 0, 0);
  return Application.aggregate([
    { $match: { appliedAt: { $gte: from } } },
    { $group: { _id: { y: { $year: '$appliedAt' }, m: { $month: '$appliedAt' } }, count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    { $project: { _id: 0, year: '$_id.y', month: '$_id.m', count: 1, avgMatch: { $round: ['$avgMatch', 0] } } },
  ]);
};

const scoreDistribution = () => Recommendation.aggregate([
  { $bucket: { groupBy: '$overallScore', boundaries: [0, 20, 40, 60, 80, 101], default: 'other', output: { count: { $sum: 1 } } } },
  { $project: { _id: 0, range: { $switch: { branches: [
    { case: { $eq: ['$_id', 0] }, then: '0-19' }, { case: { $eq: ['$_id', 20] }, then: '20-39' },
    { case: { $eq: ['$_id', 40] }, then: '40-59' }, { case: { $eq: ['$_id', 60] }, then: '60-79' },
    { case: { $eq: ['$_id', 80] }, then: '80-100' } ], default: 'other' } }, count: 1 } },
]);

const topSkillGaps = (limit = 10) => Recommendation.aggregate([
  { $match: { 'eligibility.status': { $ne: 'NOT_ELIGIBLE' } } },
  { $unwind: '$missingSkills' },
  { $group: { _id: '$missingSkills.name', count: { $sum: 1 }, students: { $addToSet: '$studentId' } } },
  { $project: { _id: 0, name: '$_id', count: 1, students: { $size: '$students' } } },
  { $sort: { count: -1 } }, { $limit: limit },
]);

const preferredLocations = () => StudentProfile.aggregate([
  { $unwind: '$preferences.locations' }, { $group: { _id: '$preferences.locations', count: { $sum: 1 } } },
  { $sort: { count: -1 } }, { $limit: 8 }, { $project: { _id: 0, name: '$_id', count: 1 } },
]);

const studentInterests = () => StudentProfile.aggregate([
  { $unwind: '$interests' }, { $group: { _id: '$interests', count: { $sum: 1 } } },
  { $sort: { count: -1 } }, { $limit: 8 }, { $project: { _id: 0, name: '$_id', count: 1 } },
]);

/** $lookup: applications joined with internships to find the most applied domains. */
const appliedDomains = (match = {}) => Application.aggregate([
  { $match: match },
  { $lookup: { from: 'internships', localField: 'internshipId', foreignField: '_id', as: 'internship' } },
  { $unwind: '$internship' },
  { $group: { _id: '$internship.domain', count: { $sum: 1 }, avgMatch: { $avg: '$matchScore' } } },
  { $sort: { count: -1 } }, { $limit: 8 },
  { $project: { _id: 0, name: '$_id', count: 1, avgMatch: { $round: ['$avgMatch', 0] } } },
]);

async function adminAnalytics() {
  const [overview, demand, domains, locations, workModes, statuses, monthly, distribution, gaps, prefLoc, interests, applied] = await Promise.all([
    adminOverview(), skillDemand(10), internshipsByDomain(), popularLocations(), byWorkMode(), applicationsByStatus(),
    monthlyApplications(), scoreDistribution(), topSkillGaps(10), preferredLocations(), studentInterests(), appliedDomains(),
  ]);
  return {
    overview,
    charts: { skillDemand: demand, internshipsByDomain: domains, popularLocations: locations, workModes, applicationsByStatus: statuses, monthlyApplications: monthly, scoreDistribution: distribution, topSkillGaps: gaps, preferredLocations: prefLoc, studentInterests: interests, appliedDomains: applied },
    highlights: {
      averageRecommendationScore: overview.averageMatchScore,
      mostCommonSkillGap: top(gaps)?.name || null,
      mostDemandedSkill: top(demand)?.name || null,
      mostPopularDomain: top(domains)?.name || null,
      mostPreferredLocation: top(prefLoc)?.name || null,
      mostAppliedInternshipType: top(applied)?.name || null,
    },
  };
}

/* ---- Student ---- */
async function studentStats(studentId) {
  const id = oid(studentId);
  const [statuses, domains, avg, selected] = await Promise.all([
    applicationsByStatus({ studentId: id }),
    appliedDomains({ studentId: id }),
    Application.aggregate([{ $match: { studentId: id } }, { $group: { _id: null, avg: { $avg: '$matchScore' }, total: { $sum: 1 } } }]),
    Application.countDocuments({ studentId: id, status: 'Selected' }),
  ]);
  return {
    totalApplications: avg[0] ? avg[0].total : 0,
    successfulApplications: selected,
    averageMatchScore: avg[0] ? Math.round(avg[0].avg) : 0,
    byStatus: statuses, mostAppliedDomains: domains,
  };
}

/* ---- Company ---- */
async function companyStats(companyId) {
  const id = oid(companyId);
  const [perInternship, statuses, activeInternships] = await Promise.all([
    Application.aggregate([
      { $match: { companyId: id } },
      { $group: { _id: '$internshipId', applications: { $sum: 1 }, avgMatch: { $avg: '$matchScore' },
        shortlisted: { $sum: { $cond: [{ $in: ['$status', ['Shortlisted', 'Interview', 'Selected']] }, 1, 0] } } } },
      { $lookup: { from: 'internships', localField: '_id', foreignField: '_id', as: 'i' } },
      { $unwind: { path: '$i', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, internshipId: '$_id', title: { $ifNull: ['$i.title', 'Removed internship'] }, applications: 1, shortlisted: 1, avgMatch: { $round: ['$avgMatch', 0] } } },
      { $sort: { applications: -1 } },
    ]),
    applicationsByStatus({ companyId: id }),
    Internship.countDocuments({ companyId: id, status: 'active', approvalStatus: 'approved' }),
  ]);
  const count = (n) => (statuses.find((s) => s.name === n) || { count: 0 }).count;
  const total = statuses.reduce((a, s) => a + s.count, 0);
  const shortlistedTotal = count('Shortlisted') + count('Interview') + count('Selected');
  return {
    activeInternships, applications: total, shortlisted: count('Shortlisted'), interviews: count('Interview'), selected: count('Selected'),
    shortlistingRate: total ? Math.round((shortlistedTotal / total) * 100) : 0,
    byStatus: statuses, perInternship,
  };
}

module.exports = {
  adminOverview, adminAnalytics, skillDemand, internshipsByDomain, popularLocations, byWorkMode, applicationsByStatus,
  monthlyApplications, scoreDistribution, topSkillGaps, appliedDomains, studentStats, companyStats,
};
