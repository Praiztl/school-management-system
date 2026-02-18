const Student  = require('./models/Student');
const Classroom = require('./models/Classroom');

class StudentManager {
  async enroll(data) {
    const exists = await Student.findOne({ email: data.email });
    if (exists) {
      const err = new Error('A student with this email already exists');
      err.status = 409;
      throw err;
    }
    if (data.classroom) {
      await this._checkCapacity(data.classroom);
    }
    const student = new Student(data);
    await student.save();
    return Student.findById(student._id).populate('school', 'name').populate('classroom', 'name');
  }

  async list({ schoolId, classroomId, page = 1, limit = 20, search } = {}) {
    const filter = {};
    if (schoolId)    filter.school    = schoolId;
    if (classroomId) filter.classroom = classroomId;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(limit)
        .populate('school', 'name').populate('classroom', 'name'),
      Student.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async findById(id) {
    const student = await Student.findById(id)
      .populate('school', 'name').populate('classroom', 'name');
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    return student;
  }

  async update(id, data) {
    if (data.classroom) {
      await this._checkCapacity(data.classroom, id);
    }
    const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('school', 'name').populate('classroom', 'name');
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    return student;
  }

  async transfer(id, { toSchool, toClassroom, note } = {}) {
    const student = await Student.findById(id);
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    if (toClassroom) {
      await this._checkCapacity(toClassroom, id);
    }
    student.transferHistory.push({
      fromSchool    : student.school,
      toSchool      : toSchool || student.school,
      fromClassroom : student.classroom,
      toClassroom   : toClassroom || null,
      note,
    });
    student.school    = toSchool    || student.school;
    student.classroom = toClassroom || null;
    await student.save();
    return Student.findById(id).populate('school', 'name').populate('classroom', 'name');
  }

  async delete(id) {
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      const err = new Error('Student not found');
      err.status = 404;
      throw err;
    }
    return student;
  }

  /** Check classroom capacity */
  async _checkCapacity(classroomId, excludeStudentId = null) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }
    const filter = { classroom: classroomId };
    if (excludeStudentId) filter._id = { $ne: excludeStudentId };
    const count = await Student.countDocuments(filter);
    if (count >= classroom.capacity) {
      const err = new Error(`Classroom is full (capacity: ${classroom.capacity})`);
      err.status = 400;
      throw err;
    }
  }
}

module.exports = new StudentManager();
