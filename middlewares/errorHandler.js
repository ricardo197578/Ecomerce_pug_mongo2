// middlewares/errorHandler.js
// Middleware de manejo de errores para toda la aplicación

// Importa la clase HttpError para identificar errores HTTP personalizados
import { HttpError } from "../utils/httpError.js";

// Exporta el middleware de manejo de errores
// Express identifica middlewares de error por tener 4 parámetros (err, req, res, next)
export function errorHandler(error, _req, res, _next) {
  
  // Si el error es una instancia de HttpError (errores controlados)
  // Ej: error 404, 400, 409 lanzados por el servicio
  if (error instanceof HttpError) {
    // Responde con el código de estado del error y renderiza vista de error
    return res.status(error.statusCode).render("error", {
      title: `Error ${error.statusCode}`,     // "Error 404"
      statusCode: error.statusCode,            // 404, 400, 409, etc.
      errorTitle: error.code,                  // "NOT_FOUND", "VALIDATION_ERROR", etc.
      errorMessage: error.message              // Mensaje descriptivo del error
    });
  }

  // Si NO es HttpError (errores no controlados, del sistema)
  // Ej: error de conexión a BD, errores de sintaxis, etc.
  console.error(error);  // Registra el error completo en consola para debug
  
  // Responde con error genérico 500 (Internal Server Error)
  return res.status(500).render("error", {
    title: "Error interno",
    statusCode: 500,
    errorTitle: "INTERNAL_ERROR",
    errorMessage: "Ocurrio un error interno del servidor."
  });
}

// ============================================
// USO EN LA APLICACIÓN (app.js)
// ============================================
// app.use(errorHandler);  // Siempre al final de todos los middlewares/rutas

