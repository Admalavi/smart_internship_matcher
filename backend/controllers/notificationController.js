const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { syncDeadlineAlerts } = require('../services/notificationService');

exports.list = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') await syncDeadlineAlerts(req.user._id);
  const [data, unread] = await Promise.all([
    Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);
  res.json({ success: true, data, meta: { unread } });
});

exports.unreadCount = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { unread: await Notification.countDocuments({ userId: req.user._id, read: false }) } });
});

exports.markRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateOne({ _id: req.params.id, userId: req.user._id }, { $set: { read: true } });
  if (!r.matchedCount) throw new ApiError(404, 'Notification not found');
  res.json({ success: true });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  res.json({ success: true, data: { modified: r.modifiedCount } });
});

exports.remove = asyncHandler(async (req, res) => {
  const r = await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
  if (!r.deletedCount) throw new ApiError(404, 'Notification not found');
  res.json({ success: true });
});
