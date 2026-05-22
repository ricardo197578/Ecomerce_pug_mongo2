import { HttpError } from "../utils/httpError.js";

export function handleMongoUnique(error, message = "Registro duplicado.") {
  if (error?.code === 11000) {
    throw new HttpError(409, "DUPLICATE_KEY", message);
  }
  throw error;
}
