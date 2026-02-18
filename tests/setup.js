const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const loader = require('../loaders');

let mongoServer;

const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const init = async (app) => {
  await connect();
  await loader({ app });

  /** 404 handler - must come after routes */
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  });
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, init, disconnect, clearDB };