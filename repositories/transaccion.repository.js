import { TransaccionModel } from "../models/Transaccion.js";
import { createBaseRepository } from "./base.repository.js";

export const transaccionRepository = createBaseRepository(TransaccionModel);
