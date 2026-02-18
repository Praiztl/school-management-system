require('dotenv').config();
const mongoose    = require('mongoose');
const User        = require('./managers/entity/models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_management');
  console.log('Connected to MongoDB');

  const exists = await User.findOne({ role: 'superadmin' });
  if (exists) {
    console.log('⚠️  Superadmin already exists:', exists.email);
    process.exit(0);
  }

  const admin = new User({
    username : 'superadmin',
    email    : 'admin@school.com',
    password : 'Admin@123',
    role     : 'superadmin',
  });
  await admin.save();
  console.log('✅ Superadmin created:');
  console.log('   Email   :', admin.email);
  console.log('   Password: Admin@123');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
