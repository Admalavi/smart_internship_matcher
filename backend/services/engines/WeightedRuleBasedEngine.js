const RecommendationEngine = require('./RecommendationEngine');
const { computeMatch } = require('../matchingService');

/** Current engine: transparent weighted rules (NOT machine learning). */
class WeightedRuleBasedEngine extends RecommendationEngine {
  get name() { return 'weighted-rule-based-v1'; }
  score(profile, internship) { return computeMatch(profile, internship); }
}
module.exports = WeightedRuleBasedEngine;
