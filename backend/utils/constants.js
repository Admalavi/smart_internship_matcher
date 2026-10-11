module.exports = {
  ROLES: ['student', 'company', 'admin'],
  APPLICATION_STATUSES: ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn'],
  COMPANY_SETTABLE_STATUSES: ['Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
  WORK_MODES: ['Onsite', 'Remote', 'Hybrid'],
  PROFICIENCY: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  IMPORTANCE: ['High', 'Medium', 'Low'],
  // Weighted scoring model (sums to 1.0)
  WEIGHTS: {
    skillMatch: 0.4,
    eligibility: 0.15,
    domainInterest: 0.15,
    locationPreference: 0.1,
    durationPreference: 0.1,
    projectRelevance: 0.1,
  },
  IMPORTANCE_WEIGHT: { High: 3, Medium: 2, Low: 1 },
  PROFICIENCY_CREDIT: { Beginner: 0.8, Intermediate: 0.9, Advanced: 1, Expert: 1 },
  PROFICIENCY_STRENGTH: { Beginner: 40, Intermediate: 62, Advanced: 82, Expert: 94 },
  PARTIAL_CREDIT: 0.5,
  INELIGIBLE_SCORE_CAP: 40,
  HIGH_MATCH_THRESHOLD: 85,
};
