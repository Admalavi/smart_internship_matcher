const Notification = require('../models/Notification');
const User = require('../models/User');
const SavedInternship = require('../models/SavedInternship');
const Internship = require('../models/Internship');

/** Creates a notification. If dedupeKey is supplied the call is idempotent (unique partial index). */
async function notify(userId, { type, title, message, link, dedupeKey, meta }) {
  if (dedupeKey) {
    const r = await Notification.updateOne(
      { userId, dedupeKey },
      { $setOnInsert: { userId, type, title, message, link, dedupeKey, meta, read: false } },
      { upsert: true }
    );
    return r.upsertedCount > 0;
  }
  await Notification.create({ userId, type, title, message, link, meta });
  return true;
}

async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
  await Promise.all(admins.map((a) => notify(a._id, payload)));
}

const bucketFor = (days) => (days <= 0 ? 'today' : days <= 2 ? '2d' : days <= 7 ? '7d' : null);

/**
 * Dynamic deadline alerts for the internships a student saved or applied to (no hard-coded alerts).
 * Idempotent: one alert per internship per urgency bucket.
 */
async function syncDeadlineAlerts(userId) {
  const Application = require('../models/Application');
  const [saved, applied] = await Promise.all([
    SavedInternship.find({ studentId: userId }).select('internshipId').lean(),
    Application.find({ studentId: userId, status: { $in: ['Applied'] } }).select('internshipId').lean(),
  ]);
  // students who already applied do not need a deadline alert
  const appliedSet = new Set(applied.map((a) => String(a.internshipId)));
  const ids = saved.map((s) => s.internshipId).filter((id) => !appliedSet.has(String(id)));
  if (!ids.length) return;
  const now = new Date();
  const soon = new Date(now.getTime() + 8 * 86400000);
  const internships = await Internship.find({
    _id: { $in: ids }, status: 'active', applicationDeadline: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), $lte: soon },
  }).select('title applicationDeadline').lean();
  for (const i of internships) {
    const days = Math.ceil((new Date(i.applicationDeadline) - now) / 86400000);
    const bucket = bucketFor(days);
    if (!bucket) continue;
    const label = bucket === 'today' ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
    await notify(userId, {
      type: 'deadline_warning',
      title: bucket === 'today' ? 'Deadline today' : 'Deadline approaching',
      message: `Applications for "${i.title}" close ${label}.`,
      link: `/internships/${i._id}`,
      dedupeKey: `deadline:${i._id}:${bucket}`,
    });
  }
}

module.exports = { notify, notifyAdmins, syncDeadlineAlerts };
