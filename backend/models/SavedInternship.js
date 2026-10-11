const mongoose = require('mongoose');

const savedSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
savedSchema.index({ studentId: 1, internshipId: 1 }, { unique: true });

module.exports = mongoose.model('SavedInternship', savedSchema);
