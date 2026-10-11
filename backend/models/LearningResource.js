const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    skillKey: { type: String, required: true, unique: true },
    steps: [String],
    resources: [{ _id: false, title: String, url: String, type: { type: String } }],
    estimatedHours: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningResource', learningResourceSchema);
