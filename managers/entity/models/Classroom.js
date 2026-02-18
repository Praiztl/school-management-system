const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name      : { type: String, required: true, trim: true },
  school    : { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  capacity  : { type: Number, required: true, min: 1 },
  resources : [{
    name : { type: String },
    quantity : { type: Number, default: 1 },
  }],
  isActive  : { type: Boolean, default: true },
}, { timestamps: true });

// Unique classroom name per school
classroomSchema.index({ name: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Classroom', classroomSchema);
