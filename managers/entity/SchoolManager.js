const School = require('./models/School');

class SchoolManager {
  async create(data) {
    const exists = await School.findOne({ name: data.name });
    if (exists) {
      const err = new Error('A school with this name already exists');
      err.status = 409;
      throw err;
    }
    const school = new School(data);
    await school.save();
    return school;
  }

  async list({ page = 1, limit = 20, search } = {}) {
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      School.find(filter).skip(skip).limit(limit),
      School.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async findById(id) {
    const school = await School.findById(id);
    if (!school) {
      const err = new Error('School not found');
      err.status = 404;
      throw err;
    }
    return school;
  }

  async update(id, data) {
    const school = await School.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!school) {
      const err = new Error('School not found');
      err.status = 404;
      throw err;
    }
    return school;
  }

  async delete(id) {
    const school = await School.findByIdAndDelete(id);
    if (!school) {
      const err = new Error('School not found');
      err.status = 404;
      throw err;
    }
    return school;
  }
}

module.exports = new SchoolManager();
