const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  username : { type: String, required: true, unique: true, trim: true, lowercase: true },
  email    : { type: String, required: true, unique: true, trim: true, lowercase: true },
  password : { type: String, required: true, minlength: 6 },
  role     : { type: String, enum: ['superadmin', 'school_admin'], required: true },
  school   : { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null }, // only for school_admin
  isActive : { type: Boolean, default: true },
}, { timestamps: true });

/** Hash password before save */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/** Compare password */
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

/** Never return password */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
