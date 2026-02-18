const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName    : { type: String, required: true, trim: true },
  lastName     : { type: String, required: true, trim: true },
  email        : { type: String, required: true, unique: true, trim: true, lowercase: true },
  dateOfBirth  : { type: Date },
  gender       : { type: String, enum: ['male', 'female', 'other'] },
  phone        : { type: String, trim: true },
  address      : { type: String, trim: true },
  school       : { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classroom    : { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
  enrolledAt   : { type: Date, default: Date.now },
  isActive     : { type: Boolean, default: true },
  transferHistory: [{
    fromSchool    : { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    toSchool      : { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    fromClassroom : { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    toClassroom   : { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    transferredAt : { type: Date, default: Date.now },
    note          : { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
