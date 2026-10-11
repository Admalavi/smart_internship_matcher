const mongoose = require('mongoose');
const { PROFICIENCY, WORK_MODES } = require('../utils/constants');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'General' },
  proficiency: { type: String, enum: PROFICIENCY, default: 'Intermediate' },
  yearsOfExperience: { type: Number, min: 0, max: 30, default: 0 },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  technologies: [{ type: String, trim: true }],
  role: { type: String, trim: true },
  githubUrl: { type: String, trim: true },
});

const certSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  issuer: { type: String, trim: true },
  issueDate: { type: Date },
  credentialUrl: { type: String, trim: true },
});

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    education: {
      degree: { type: String, trim: true },
      branch: { type: String, trim: true },
      college: { type: String, trim: true },
      graduationYear: { type: Number },
      cgpa: { type: Number, min: 0, max: 10 },
    },
    skills: [skillSchema],
    projects: [projectSchema],
    certifications: [certSchema],
    preferences: {
      domains: [{ type: String, trim: true }],
      locations: [{ type: String, trim: true }],
      workModes: [{ type: String, enum: WORK_MODES }],
      durationPreference: { type: Number, min: 1, max: 12 }, // months
      minStipend: { type: Number, min: 0, default: 0 },
    },
    interests: [{ type: String, trim: true }],
    resumeUrl: { type: String },
    profileCompletion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studentProfileSchema.index({ 'skills.name': 1 });
studentProfileSchema.index({ 'education.branch': 1, 'education.graduationYear': 1 });

/** Dynamic profile completion (education 20, skills 25, projects 20, certs 15, preferences 20). */
studentProfileSchema.methods.computeCompletion = function () {
  const e = this.education || {};
  const p = this.preferences || {};
  let score = 0;
  const missing = [];
  const eduFields = [e.degree, e.branch, e.college, e.graduationYear, e.cgpa];
  score += Math.round((eduFields.filter((v) => v !== undefined && v !== null && v !== '').length / 5) * 20);
  if (eduFields.some((v) => v === undefined || v === null || v === '')) missing.push('Complete your education details');
  score += Math.min(this.skills.length, 5) * 5;
  if (this.skills.length < 5) missing.push(this.skills.length < 3 ? 'Add at least 3 skills' : 'Add more skills to reach 5');
  score += Math.min(this.projects.length, 2) * 10;
  if (this.projects.length < 2) missing.push('Add projects');
  score += this.certifications.length ? 15 : 0;
  if (!this.certifications.length) missing.push('Add certifications');
  const prefParts = [p.domains?.length, p.locations?.length, p.workModes?.length, p.durationPreference];
  score += prefParts.filter(Boolean).length * 5;
  if (prefParts.some((x) => !x)) missing.push('Set your internship preferences');
  return { score: Math.min(score, 100), missing };
};

studentProfileSchema.pre('save', function (next) {
  this.profileCompletion = this.computeCompletion().score;
  next();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
