const mongoose = require('mongoose');

const skillCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    key: { type: String, required: true, unique: true }, // normalised
    category: { type: String, required: true },
    aliases: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SkillCatalog', skillCatalogSchema);
