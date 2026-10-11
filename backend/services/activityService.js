const ActivityHistory = require('../models/ActivityHistory');

/** Fire-and-forget logging: never breaks the main request. */
const logActivity = (userId, action, { entityType, entityId, meta } = {}) =>
  ActivityHistory.create({ userId, action, entityType, entityId, meta }).catch(() => null);

module.exports = { logActivity };
