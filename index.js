require('dotenv').config();
const app    = require('./app');
const loader = require('./loaders');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await loader({ app });

  /** ── 404 Handler (after routes) ── */
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  /** ── Global Error Handler ── */
  app.use((err, req, res, next) => {
    console.error(err.stack);
    const status  = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
  });

  app.listen(PORT, () => {
    console.log(`🚀 School Management System running on port ${PORT}`);
  });
};

start();

module.exports = app;