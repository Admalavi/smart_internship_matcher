const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { validateRegister, validateLogin } = require('../validators/validators');

exports.register = asyncHandler(async (req, res) => {
  validateRegister(req.body);
  const { name, email, password, role, phone, companyName } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, role, phone });
  if (role === 'student') await StudentProfile.create({ userId: user._id });
  if (role === 'company') await Company.create({ userId: user._id, companyName });
  res.status(201).json({ success: true, data: { user, token: generateToken(user) } });
});

exports.login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Contact the administrator.');
  res.json({ success: true, data: { user, token: generateToken(user) } });
});

exports.me = asyncHandler(async (req, res) => {
  const data = { user: req.user };
  if (req.user.role === 'student') data.profile = await StudentProfile.findOne({ userId: req.user._id });
  if (req.user.role === 'company') data.company = await Company.findOne({ userId: req.user._id });
  res.json({ success: true, data });
});

exports.logout = (_req, res) => res.json({ success: true, message: 'Logged out. Discard the token on the client.' });
