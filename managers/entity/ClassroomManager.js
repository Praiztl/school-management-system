const Classroom = require('./models/Classroom');

class ClassroomManager {
  async create(data) {
    const exists = await Classroom.findOne({ name: data.name, school: data.school });
    if (exists) {
      const err = new Error('A classroom with this name already exists in this school');
      err.status = 409;
      throw err;
    }
    const classroom = new Classroom(data);
    await classroom.save();
    return classroom.populate('school', 'name');
  }

  async list({ schoolId, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (schoolId) filter.school = schoolId;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Classroom.find(filter).skip(skip).limit(limit).populate('school', 'name'),
      Classroom.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async findById(id) {
    const classroom = await Classroom.findById(id).populate('school', 'name');
    if (!classroom) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }
    return classroom;
  }

  async update(id, data) {
    const classroom = await Classroom.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('school', 'name');
    if (!classroom) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }
    return classroom;
  }

  async delete(id) {
    const classroom = await Classroom.findByIdAndDelete(id);
    if (!classroom) {
      const err = new Error('Classroom not found');
      err.status = 404;
      throw err;
    }
    return classroom;
  }
}

module.exports = new ClassroomManager();
