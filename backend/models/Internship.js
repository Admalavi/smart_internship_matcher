const mongoose = require('mongoose');
const { WORK_MODES, IMPORTANCE } = require('../utils/constants');

const requiredSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    importance: { type: String, enum: IMPORTANCE, default: 'Medium' },
  },
  { _id: false }
);

const internshipSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    requiredSkills: { type: [requiredSkillSchema], validate: (v) => v.length > 0 },
    preferredSkills: [{ type: String, trim: true }],
    eligibility: {
      minCGPA: { type: Number, min: 0, max: 10, default: 0 },
      branches: [{ type: String, trim: true }],
      graduationYears: [{ type: Number }],
      requiredDegree: { type: String, trim: true },
    },
    location: { type: String, required: true, trim: true },
    workMode: { type: String, enum: WORK_MODES, default: 'Onsite' },
    duration: { type: Number, required: true, min: 1, max: 12 }, // months
    stipend: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    responsibilities: [{ type: String, trim: true }],
    benefits: [{ type: String, trim: true }],
    openings: { type: Number, default: 1 },
    applicationDeadline: { type: Date, required: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    tags: [{ type: String, trim: true }],
    // Flexible schema: each internship may carry different, domain-specific attributes
    // e.g. { "researchPublication": true } or { "portfolioRequired": true, "tools": ["Figma"] }
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// ---- Indexes (documented in README) ----
internshipSchema.index(
  { title: 'text', description: 'text', domain: 'text', tags: 'text', location: 'text', 'requiredSkills.name': 'text' },
  { name: 'internship_text_idx', weights: { title: 10, domain: 6, tags: 5, 'requiredSkills.name': 4, location: 3, description: 1 } }
);
internshipSchema.index({ title: 1 });
internshipSchema.index({ domain: 1 });
internshipSchema.index({ location: 1 });
internshipSchema.index({ 'requiredSkills.name': 1 });
internshipSchema.index({ applicationDeadline: 1 });
internshipSchema.index({ status: 1, approvalStatus: 1, applicationDeadline: 1 }); // discovery listing
internshipSchema.index({ domain: 1, location: 1, workMode: 1 }); // filter combination
internshipSchema.index({ companyId: 1, createdAt: -1 }); // company dashboard

module.exports = mongoose.model('Internship', internshipSchema);
