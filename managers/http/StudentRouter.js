const express        = require('express');
const router         = express.Router();
const StudentManager = require('../entity/StudentManager');
const { ok, created, error } = require('../../libs/respond');
const { validate, schemas }  = require('../../mws/validate.mw');
const { authenticate }       = require('../../mws/auth.mw');

router.use(authenticate);

/** Helper: ensure school_admin accesses only their school */
const guardSchool = (userSchoolId, resourceSchoolId, res) => {
  if (!userSchoolId) return false; // superadmin
  if (userSchoolId.toString() !== resourceSchoolId?.toString()) {
    error(res, 'Access denied: not your school', 403);
    return true; // blocked
  }
  return false;
};

/**
 * @route  POST /api/students
 * @desc   Enroll a new student
 * @access Superadmin, School Admin (own school)
 */
router.post('/', validate(schemas.enrollStudent), async (req, res) => {
  try {
    if (req.user.role === 'school_admin') {
      if (guardSchool(req.user.school?._id, req.body.school, res)) return;
    }
    const student = await StudentManager.enroll(req.body);
    return created(res, { student }, 'Student enrolled successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/students
 * @access Superadmin (all), School Admin (their school)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, school, classroom, search } = req.query;
    const schoolId = req.user.role === 'school_admin'
      ? req.user.school?._id?.toString()
      : school;
    const result = await StudentManager.list({ schoolId, classroomId: classroom, page: +page, limit: +limit, search });
    return ok(res, result, 'Students retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  GET /api/students/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const student = await StudentManager.findById(req.params.id);
    if (req.user.role === 'school_admin') {
      if (guardSchool(req.user.school?._id, student.school._id, res)) return;
    }
    return ok(res, { student }, 'Student retrieved');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  PUT /api/students/:id
 */
router.put('/:id', validate(schemas.updateStudent), async (req, res) => {
  try {
    const existing = await StudentManager.findById(req.params.id);
    if (req.user.role === 'school_admin') {
      if (guardSchool(req.user.school?._id, existing.school._id, res)) return;
    }
    const student = await StudentManager.update(req.params.id, req.body);
    return ok(res, { student }, 'Student updated successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  POST /api/students/:id/transfer
 * @desc   Transfer student to another school/classroom
 * @access Superadmin, School Admin (origin school)
 */
router.post('/:id/transfer', validate(schemas.transferStudent), async (req, res) => {
  try {
    const existing = await StudentManager.findById(req.params.id);
    if (req.user.role === 'school_admin') {
      if (guardSchool(req.user.school?._id, existing.school._id, res)) return;
    }
    const student = await StudentManager.transfer(req.params.id, req.body);
    return ok(res, { student }, 'Student transferred successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

/**
 * @route  DELETE /api/students/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const existing = await StudentManager.findById(req.params.id);
    if (req.user.role === 'school_admin') {
      if (guardSchool(req.user.school?._id, existing.school._id, res)) return;
    }
    await StudentManager.delete(req.params.id);
    return ok(res, {}, 'Student deleted successfully');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
});

module.exports = router;
