import { SuscripcionModel } from "../models/Suscripcion.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(SuscripcionModel);

export const suscripcionRepository = {
  ...base,
  async findByComercioId(comercioId) {
    return SuscripcionModel.findOne({ comercioId }).lean();
  }
};
