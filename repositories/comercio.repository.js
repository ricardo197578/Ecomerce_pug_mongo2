import { ComercioModel } from "../models/Comercio.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(ComercioModel);

export const comercioRepository = {
  ...base,
  async findByCuit(cuit) {
    return ComercioModel.findOne({ cuit }).lean();
  }
};
