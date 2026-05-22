import { PagoModel } from "../models/Pago.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(PagoModel);

export const pagoRepository = {
  ...base,
  async findByTransaccionId(transaccionId) {
    return PagoModel.findOne({ transaccionId }).lean();
  }
};
