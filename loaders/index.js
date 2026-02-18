const db           = require('../connect/db');
const UserManager  = require('../managers/entity/UserManager');
const SchoolManager    = require('../managers/entity/SchoolManager');
const ClassroomManager = require('../managers/entity/ClassroomManager');
const StudentManager   = require('../managers/entity/StudentManager');

const AuthRouter      = require('../managers/http/AuthRouter');
const SchoolRouter    = require('../managers/http/SchoolRouter');
const ClassroomRouter = require('../managers/http/ClassroomRouter');
const StudentRouter   = require('../managers/http/StudentRouter');

module.exports = async ({ app }) => {
  /** ── Database Connection ── */
  await db.connect();

  /** ── Mount Routers ── */
  app.use('/api/auth',       AuthRouter);
  app.use('/api/schools',    SchoolRouter);
  app.use('/api/classrooms', ClassroomRouter);
  app.use('/api/students',   StudentRouter);

  /** ── Health Check ── */
  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'School Management System is running', timestamp: new Date() });
  });

  console.log('✅ All managers loaded');
};
