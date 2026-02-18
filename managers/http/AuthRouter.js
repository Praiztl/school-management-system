const express     = require('express');
const router      = express.Router();
const UserManager = require('../entity/UserManager');
const { sign }    = require('../../libs/token');
const { ok, created, error } = require('../../libs/respond');
const { validate, schemas }  = require('../../mws/validate.mw');
const { authenticate }       = require('../../mws/auth.mw');

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user (superadmin can create any role; first user becomes superadmin)
 * @access Public (first user) / Private Superadmin
 */
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const user  = await UserManager.create(req.body);
    const token = sign({ id: user._id, role: user.role });
    return created(res, { user, token }, 'User registered successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  POST /api/auth/login
 * @desc   Login and get JWT token
 * @access Public
 */
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserManager.findByEmail(email);
    if (!user) return error(res, 'Invalid credentials', 401);

    const match = await user.comparePassword(password);
    if (!match) return error(res, 'Invalid credentials', 401);

    const token = sign({ id: user._id, role: user.role });
    return ok(res, { user, token }, 'Login successful');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/auth/me
 * @desc   Get current user profile
 * @access Private
 */
router.get('/me', authenticate, async (req, res) => {
  return ok(res, { user: req.user }, 'Profile retrieved');
});

module.exports = router;
