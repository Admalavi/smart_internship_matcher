const RecommendationEngine = require('./RecommendationEngine');

/**
 * Extension point for a future learned model (e.g. embeddings / learning-to-rank trained on
 * ActivityHistory + Application outcomes). Intentionally NOT implemented - no fake ML.
 */
class MLRecommendationEngine extends RecommendationEngine {
  get name() { return 'ml-recommender (not implemented)'; }
  score() { throw new Error('MLRecommendationEngine is a placeholder: train and plug in a model first.'); }
}
module.exports = MLRecommendationEngine;
