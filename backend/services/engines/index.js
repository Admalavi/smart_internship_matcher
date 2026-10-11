const WeightedRuleBasedEngine = require('./WeightedRuleBasedEngine');
const MLRecommendationEngine = require('./MLRecommendationEngine');

const registry = { 'rule-based': WeightedRuleBasedEngine, ml: MLRecommendationEngine };
let instance;
const getEngine = () => {
  if (!instance) {
    const Engine = registry[process.env.RECOMMENDATION_ENGINE || 'rule-based'] || WeightedRuleBasedEngine;
    instance = new Engine();
  }
  return instance;
};
module.exports = { getEngine };
