const mongoose = require('mongoose');

let mongod;
/** Uses MONGODB_URI_TEST when provided, otherwise an in-memory MongoDB (downloads a mongod binary on first run). */
exports.connect = async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.NODE_ENV = 'test';
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
};
exports.clear = async () => Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
exports.disconnect = async () => {
  if (process.env.MONGODB_URI_TEST) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
