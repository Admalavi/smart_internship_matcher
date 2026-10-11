const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const extract = (req) => {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.split(' ')[1] : null;
};

const loadUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated');
  return user;
};

const protect = asyncHandler(async (req, _res, next) => {
  const token = extract(req);
  if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');
  try {
    req.user = await loadUser(token);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(401, 'Invalid or expired token. Please log in again.');
  }
  next();
});

/** Attaches req.user when a valid token is present, but never blocks the request. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extract(req);
  if (token) {
    try { req.user = await loadUser(token); } catch (_e) { /* ignore: treated as anonymous */ }
  }
  next();
});

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) throw new ApiError(403, 'You do not have permission to perform this action');
  next();
};

module.exports = { protect, optionalAuth, authorize };
