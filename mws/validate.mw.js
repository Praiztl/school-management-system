const Joi = require('joi');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property], { abortEarly: false });
  if (!error) return next();
  const message = error.details.map(d => d.message).join(', ');
  return res.status(400).json({ success: false, message });
};

// ── Schemas ──────────────────────────────────────────────

const schemas = {
  /** Auth */
  register: Joi.object({
    username : Joi.string().min(3).max(30).required(),
    email    : Joi.string().email().required(),
    password : Joi.string().min(6).required(),
    role     : Joi.string().valid('superadmin', 'school_admin').required(),
    school   : Joi.string().hex().length(24).when('role', {
      is   : 'school_admin',
      then : Joi.required(),
    }),
  }),

  login: Joi.object({
    email    : Joi.string().email().required(),
    password : Joi.string().required(),
  }),

  /** School */
  createSchool: Joi.object({
    name    : Joi.string().min(2).max(100).required(),
    address : Joi.string().min(5).required(),
    phone   : Joi.string().optional(),
    email   : Joi.string().email().optional(),
    website : Joi.string().uri().optional(),
    logo    : Joi.string().optional(),
  }),

  updateSchool: Joi.object({
    name    : Joi.string().min(2).max(100),
    address : Joi.string().min(5),
    phone   : Joi.string(),
    email   : Joi.string().email(),
    website : Joi.string().uri(),
    logo    : Joi.string(),
    isActive: Joi.boolean(),
  }).min(1),

  /** Classroom */
  createClassroom: Joi.object({
    name      : Joi.string().min(1).max(50).required(),
    school    : Joi.string().hex().length(24).required(),
    capacity  : Joi.number().integer().min(1).required(),
    resources : Joi.array().items(Joi.object({
      name     : Joi.string().required(),
      quantity : Joi.number().integer().min(1).default(1),
    })).optional(),
  }),

  updateClassroom: Joi.object({
    name      : Joi.string().min(1).max(50),
    capacity  : Joi.number().integer().min(1),
    resources : Joi.array().items(Joi.object({
      name     : Joi.string().required(),
      quantity : Joi.number().integer().min(1).default(1),
    })),
    isActive  : Joi.boolean(),
  }).min(1),

  /** Student */
  enrollStudent: Joi.object({
    firstName   : Joi.string().min(1).required(),
    lastName    : Joi.string().min(1).required(),
    email       : Joi.string().email().required(),
    dateOfBirth : Joi.date().iso().optional(),
    gender      : Joi.string().valid('male', 'female', 'other').optional(),
    phone       : Joi.string().optional(),
    address     : Joi.string().optional(),
    school      : Joi.string().hex().length(24).required(),
    classroom   : Joi.string().hex().length(24).optional(),
  }),

  updateStudent: Joi.object({
    firstName   : Joi.string().min(1),
    lastName    : Joi.string().min(1),
    dateOfBirth : Joi.date().iso(),
    gender      : Joi.string().valid('male', 'female', 'other'),
    phone       : Joi.string(),
    address     : Joi.string(),
    classroom   : Joi.string().hex().length(24).allow(null),
    isActive    : Joi.boolean(),
  }).min(1),

  transferStudent: Joi.object({
    toSchool    : Joi.string().hex().length(24).optional(),
    toClassroom : Joi.string().hex().length(24).optional(),
    note        : Joi.string().optional(),
  }).or('toSchool', 'toClassroom'),
};

module.exports = { validate, schemas };
