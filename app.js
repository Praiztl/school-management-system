const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const app = express();

/** ── Security Middleware ── */
app.use(helmet());
app.use(cors());

/** ── Rate Limiting ── */
const limiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 100,
  message  : { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

/** ── Body Parsing ── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/** ── Logging ── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

module.exports = app;