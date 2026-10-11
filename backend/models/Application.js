const mongoose = require('mongoose');
const { APPLICATION_STATUSES } = require('../utils/constants');

const applicationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // denormalised for fast company queries
    status: { type: String, enum: APPLICATION_STATUSES, default: 'Applied' },
    appliedAt: { type: Date, default: Date.now },
    statusHistory: [
      {
        _id: false,
        status: String,
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    matchScore: { type: Number, default: 0 },
    skillMatchPercentage: { type: Number, default: 0 },
    eligibilityScore: { type: Number, default: 0 },
    coverNote: { type: String, maxlength: 1500 },
    // Snapshot (embedding/denormalisation): survives profile edits or internship deletion
    snapshot: {
      studentName: String,
      college: String,
      cgpa: Number,
      internshipTitle: String,
      companyName: String,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ studentId: 1, internshipId: 1 }, { unique: true }); // prevents duplicate applications
applicationSchema.index({ internshipId: 1, status: 1 });
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ appliedAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
