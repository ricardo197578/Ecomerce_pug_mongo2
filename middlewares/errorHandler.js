import { HttpError } from "../utils/httpError.js";

export function errorHandler(error, _req, res, _next) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).render("error", {
      title: `Error ${error.statusCode}`,
      statusCode: error.statusCode,
      errorTitle: error.code,
      errorMessage: error.message
    });
  }

  console.error(error);
  return res.status(500).render("error", {
    title: "Error interno",
    statusCode: 500,
    errorTitle: "INTERNAL_ERROR",
    errorMessage: "Ocurrio un error interno del servidor."
  });
}
