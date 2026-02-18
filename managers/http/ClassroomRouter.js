const express          = require('express');
const router           = express.Router();
const ClassroomManager = require('../entity/ClassroomManager');
const { ok, created, error } = require('../../libs/respond');
const { validate, schemas }  = require('../../mws/validate.mw');
const { authenticate, authorize } = require('../../mws/auth.mw');

router.use(authenticate);

/**
 * @route  POST /api/classrooms
 * @desc   Create a classroom (must belong to a school the admin manages)
 * @access Superadmin, School Admin (own school)
 */
router.post('/', validate(schemas.createClassroom), async (req, res) => {
  try {
    if (req.user.role === 'school_admin' &&
        req.user.school?._id?.toString() !== req.body.school) {
      return error(res, 'Access denied: not your school', 403);
    }
    const classroom = await ClassroomManager.create(req.body);
    return created(res, { classroom }, 'Classroom created successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/classrooms
 * @desc   List classrooms (school_admin sees only their school's)
 * @access Superadmin, School Admin
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, school } = req.query;
    const schoolId = req.user.role === 'school_admin'
      ? req.user.school?._id?.toString()
      : school;
    const result = await ClassroomManager.list({ schoolId, page: +page, limit: +limit });
    return ok(res, result, 'Classrooms retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/classrooms/:id
 * @access Superadmin, School Admin (own school)
 */
router.get('/:id', async (req, res) => {
  try {
    const classroom = await ClassroomManager.findById(req.params.id);
    if (req.user.role === 'school_admin' &&
        req.user.school?._id?.toString() !== classroom.school._id.toString()) {
      return error(res, 'Access denied: not your school', 403);
    }
    return ok(res, { classroom }, 'Classroom retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  PUT /api/classrooms/:id
 * @access Superadmin, School Admin (own school)
 */
router.put('/:id', validate(schemas.updateClassroom), async (req, res) => {
  try {
    const existing = await ClassroomManager.findById(req.params.id);
    if (req.user.role === 'school_admin' &&
        req.user.school?._id?.toString() !== existing.school._id.toString()) {
      return error(res, 'Access denied: not your school', 403);
    }
    const classroom = await ClassroomManager.update(req.params.id, req.body);
    return ok(res, { classroom }, 'Classroom updated successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  DELETE /api/classrooms/:id
 * @access Superadmin, School Admin (own school)
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await ClassroomManager.findById(req.params.id);
    if (req.user.role === 'school_admin' &&
        req.user.school?._id?.toString() !== existing.school._id.toString()) {
      return error(res, 'Access denied: not your school', 403);
    }
    await ClassroomManager.delete(req.params.id);
    return ok(res, {}, 'Classroom deleted successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
