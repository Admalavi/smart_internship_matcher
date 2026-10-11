const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    overallScore: { type: Number, required: true },
    scores: {
      skillMatch: Number,
      eligibility: Number,
      domainInterest: Number,
      locationPreference: Number,
      durationPreference: Number,
      projectRelevance: Number,
    },
    skillMatchPercentage: Number,
    matchedSkills: [{ _id: false, name: String, importance: String, proficiency: String }],
    partialSkills: [{ _id: false, name: String, importance: String, via: String }],
    missingSkills: [{ _id: false, name: String, key: String, importance: String, severity: String }],
    eligibility: {
      status: { type: String, enum: ['ELIGIBLE', 'PARTIALLY_ELIGIBLE', 'NOT_ELIGIBLE'] },
      reasons: [String],
    },
    confidence: String,
    explanation: [{ _id: false, type: { type: String }, text: String }],
    engine: String,
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

recommendationSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });
recommendationSchema.index({ studentId: 1, overallScore: -1 });
recommendationSchema.index({ internshipId: 1, overallScore: -1 });
recommendationSchema.index({ 'missingSkills.name': 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
