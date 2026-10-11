const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    logo: { type: String },
    description: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
    companySize: { type: String, trim: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });

module.exports = mongoose.model('Company', companySchema);
