const mongoose = require('mongoose');

/**
 * Builds every index declared in the schemas (text, compound, unique, TTL).
 * Called on startup and by the seed script. All indexes are documented in README.
 */
const initIndexes = async () => {
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((m) => m.createIndexes()));
  const summary = {};
  for (const m of models) {
    const idx = await m.collection.indexes();
    summary[m.collection.name] = idx.map((i) => i.name);
  }
  return summary;
};

module.exports = initIndexes;
