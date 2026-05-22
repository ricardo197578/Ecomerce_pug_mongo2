import { UsuarioModel } from "../models/Usuario.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(UsuarioModel);

export const usuarioRepository = {
  ...base,
  async findByEmail(email) {
    return UsuarioModel.findOne({ email }).lean();
  }
};
