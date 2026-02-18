const User = require('./models/User');

class UserManager {
  /** Create a new user */
  async create({ username, email, password, role, school = null }) {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const err = new Error('User with this email or username already exists');
      err.status = 409;
      throw err;
    }
    if (role === 'school_admin' && !school) {
      const err = new Error('School ID is required for school_admin role');
      err.status = 400;
      throw err;
    }
    const user = new User({ username, email, password, role, school });
    await user.save();
    return user;
  }

  /** Find by email */
  async findByEmail(email) {
    return User.findOne({ email, isActive: true }).populate('school', 'name _id');
  }

  /** Find by ID */
  async findById(id) {
    return User.findById(id).populate('school', 'name _id');
  }

  /** List all users (superadmin) */
  async list({ page = 1, limit = 20, role } = {}) {
    const filter = {};
    if (role) filter.role = role;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-password').populate('school', 'name'),
      User.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }
}

module.exports = new UserManager();
