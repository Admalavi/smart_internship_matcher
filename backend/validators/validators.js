const ApiError = require('../utils/ApiError');

const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const strongPassword = (s) => typeof s === 'string' && s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);

const required = (body, fields) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === '');
  if (missing.length) throw new ApiError(400, `Missing required field(s): ${missing.join(', ')}`, missing);
};

const validateRegister = (body) => {
  required(body, ['name', 'email', 'password', 'role']);
  if (!isEmail(body.email)) throw new ApiError(400, 'Please provide a valid email address');
  if (!strongPassword(body.password)) throw new ApiError(400, 'Password must be at least 8 characters and contain letters and numbers');
  if (!['student', 'company'].includes(body.role)) throw new ApiError(400, 'Role must be student or company');
  if (body.role === 'company') required(body, ['companyName']);
};

const validateLogin = (body) => {
  required(body, ['email', 'password']);
  if (!isEmail(body.email)) throw new ApiError(400, 'Please provide a valid email address');
};

const validateInternship = (b, { partial = false } = {}) => {
  if (!partial) required(b, ['title', 'description', 'domain', 'location', 'duration', 'applicationDeadline']);
  if (!partial && (!Array.isArray(b.requiredSkills) || !b.requiredSkills.length)) throw new ApiError(400, 'Add at least one required skill');
  if (b.duration !== undefined && !(Number(b.duration) >= 1 && Number(b.duration) <= 12)) throw new ApiError(400, 'Duration must be between 1 and 12 months');
  if (b.applicationDeadline && isNaN(new Date(b.applicationDeadline).getTime())) throw new ApiError(400, 'Invalid application deadline');
  if (b.eligibility?.minCGPA !== undefined && (b.eligibility.minCGPA < 0 || b.eligibility.minCGPA > 10)) throw new ApiError(400, 'Minimum CGPA must be between 0 and 10');
};

module.exports = { isEmail, strongPassword, required, validateRegister, validateLogin, validateInternship };
