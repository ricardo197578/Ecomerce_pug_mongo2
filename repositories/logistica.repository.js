import { LogisticaModel } from "../models/Logistica.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(LogisticaModel);

export const logisticaRepository = {
  ...base,
  async findByTransaccionId(transaccionId) {
    return LogisticaModel.findOne({ transaccionId }).lean();
  }
};
