require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const initIndexes = require('./config/indexes');
const Internship = require('./models/Internship');

const PORT = process.env.PORT || 5000;

/** Closes internships whose deadline passed (timestamps:false so it does not invalidate recommendation caches). */
const closeExpired = () =>
  Internship.updateMany({ status: 'active', applicationDeadline: { $lt: new Date() } }, { $set: { status: 'closed' } }, { timestamps: false })
    .then((r) => r.modifiedCount && console.log(`Closed ${r.modifiedCount} expired internship(s)`))
    .catch((e) => console.error('closeExpired failed', e.message));

(async () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined. Copy .env.example to .env');
  await connectDB();
  const idx = await initIndexes();
  console.log('Indexes ready:', Object.entries(idx).map(([c, n]) => `${c}(${n.length})`).join(', '));
  await closeExpired();
  setInterval(closeExpired, 60 * 60 * 1000);
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})().catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
