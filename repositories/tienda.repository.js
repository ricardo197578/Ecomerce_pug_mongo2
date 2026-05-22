import { TiendaModel } from "../models/Tienda.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(TiendaModel);

export const tiendaRepository = {
  ...base,
  async findByComercioAndNombre(comercioId, nombre) {
    return TiendaModel.findOne({ comercioId, nombre }).lean();
  }
};
