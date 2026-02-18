const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const disconnect = async () => {
  await mongoose.disconnect();
};

module.exports = { connect, disconnect };
