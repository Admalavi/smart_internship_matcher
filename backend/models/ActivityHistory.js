const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['internship_viewed', 'internship_saved', 'internship_unsaved', 'internship_applied', 'recommendation_viewed', 'recommendations_generated', 'skill_added', 'skill_removed', 'profile_updated', 'resume_parsed'],
      required: true,
    },
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
// TTL index: activity logs auto-expire after 180 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('ActivityHistory', activitySchema);
