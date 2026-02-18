const express       = require('express');
const router        = express.Router();
const SchoolManager = require('../entity/SchoolManager');
const { ok, created, error } = require('../../libs/respond');
const { validate, schemas }  = require('../../mws/validate.mw');
const { authenticate, authorize } = require('../../mws/auth.mw');

// All school routes require authentication
router.use(authenticate);

/**
 * @route  POST /api/schools
 * @desc   Create a new school
 * @access Superadmin
 */
router.post('/', authorize('superadmin'), validate(schemas.createSchool), async (req, res) => {
  try {
    const school = await SchoolManager.create(req.body);
    return created(res, { school }, 'School created successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/schools
 * @desc   List all schools
 * @access Superadmin, School Admin
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await SchoolManager.list({ page: +page, limit: +limit, search });
    return ok(res, result, 'Schools retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/schools/:id
 * @desc   Get a single school
 * @access Superadmin, School Admin (own school)
 */
router.get('/:id', async (req, res) => {
  try {
    // school_admin can only view their own school
    if (req.user.role === 'school_admin' &&
        req.user.school?._id?.toString() !== req.params.id) {
      return error(res, 'Access denied: not your school', 403);
    }
    const school = await SchoolManager.findById(req.params.id);
    return ok(res, { school }, 'School retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  PUT /api/schools/:id
 * @desc   Update a school
 * @access Superadmin
 */
router.put('/:id', authorize('superadmin'), validate(schemas.updateSchool), async (req, res) => {
  try {
    const school = await SchoolManager.update(req.params.id, req.body);
    return ok(res, { school }, 'School updated successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  DELETE /api/schools/:id
 * @desc   Delete a school
 * @access Superadmin
 */
router.delete('/:id', authorize('superadmin'), async (req, res) => {
  try {
    await SchoolManager.delete(req.params.id);
    return ok(res, {}, 'School deleted successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
