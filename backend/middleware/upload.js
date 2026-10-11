const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const dir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: dir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
});

const make = (allowed, exts) =>
  multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = allowed.includes(file.mimetype) && exts.includes(path.extname(file.originalname).toLowerCase());
      cb(ok ? null : new ApiError(400, `Invalid file type. Allowed: ${exts.join(', ')}`), ok);
    },
  });

const uploadImage = make(['image/png', 'image/jpeg', 'image/webp'], ['.png', '.jpg', '.jpeg', '.webp']);
const uploadResume = make(
  ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.pdf', '.txt', '.doc', '.docx']
);

module.exports = { uploadImage, uploadResume };
