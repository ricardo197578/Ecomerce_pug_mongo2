export function createBaseRepository(model) {
  return {
    async findAll(filter = {}) {
      return model.find(filter).lean();
    },
    async findById(id) {
      return model.findById(id).lean();
    },
    async create(data) {
      const created = await model.create(data);
      return created.toObject();
    },
    async update(id, fields) {
      return model.findByIdAndUpdate(id, fields, { new: true }).lean();
    },
    async remove(id) {
      const result = await model.deleteOne({ _id: id });
      return result.deletedCount > 0;
    }
  };
}
