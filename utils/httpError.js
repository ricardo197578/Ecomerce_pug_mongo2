// utils/httpError.js
// Clase para crear errores HTTP personalizados y estandarizados

// Exporta la clase HttpError que extiende la clase nativa Error de JavaScript
export class HttpError extends Error {
  
  /**
   * Constructor de HttpError
   * @param {number} statusCode - Código HTTP (404, 400, 409, 500, etc.)
   * @param {string} code - Código interno de error (NOT_FOUND, VALIDATION_ERROR, etc.)
   * @param {string} message - Mensaje descriptivo para el usuario
   * @param {*} details - Información adicional (opcional, null por defecto)
   */
  constructor(statusCode, code, message, details = null) {
    // Llama al constructor de Error con el mensaje
    // Esto establece this.message = message
    super(message);
    
    // Asigna el nombre del error (útil para debugging)
    // Permite identificar que es un HttpError
    this.name = "HttpError";
    
    // Código HTTP (404, 400, 409, etc.)
    // Se usa para establecer el código de estado de la respuesta
    this.statusCode = statusCode;
    
    // Código interno de error (NOT_FOUND, VALIDATION_ERROR, etc.)
    // Sirve para identificar el tipo de error en el frontend
    this.code = code;
    
    // Detalles adicionales del error
    // Puede ser información extra para debugging o contexto
    this.details = details;
    
    // NOTA: No se usa Error.captureStackTrace porque no es necesario
    // para este caso de uso, pero se podría agregar para mejor debugging
  }
}

