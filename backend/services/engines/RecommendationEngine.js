/** Abstract recommendation engine. Any engine must return the shape produced by computeMatch(). */
class RecommendationEngine {
  get name() { throw new Error('Engine must define a name'); }
  // eslint-disable-next-line no-unused-vars
  score(profile, internship) { throw new Error('score() not implemented'); }
}
module.exports = RecommendationEngine;
