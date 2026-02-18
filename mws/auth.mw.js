const jwt  = require('jsonwebtoken');
const User = require('../managers/entity/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/** Verify JWT and attach user to req */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).populate('school', '_id name');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/** Allow only specific roles */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  }
  next();
};

/** Ensure school_admin only accesses their own school's resources */
const schoolScope = (getSchoolId) => (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  const resourceSchoolId = getSchoolId(req);
  if (!resourceSchoolId) return next();
  if (req.user.school?._id?.toString() !== resourceSchoolId.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied: not your school' });
  }
  next();
};

module.exports = { authenticate, authorize, schoolScope };
