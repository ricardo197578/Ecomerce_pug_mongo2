// middlewares/notFoundHandler.js
// Middleware para manejar rutas no encontradas (404)

// Exporta el middleware que maneja peticiones a rutas inexistentes
// Se ejecuta cuando ninguna ruta coincide con la petición
export function notFoundHandler(_req, res) {
  // Responde con código 404 (Not Found)
  // Renderiza la vista de error con mensaje específico
  res.status(404).render("error", {
    title: "No encontrado",              // Título de la página
    statusCode: 404,                     // Código HTTP
    errorTitle: "NOT_FOUND",             // Código interno de error
    errorMessage: "La ruta que buscas no existe."  // Mensaje amigable para el usuario
  });
}

// ============================================
// USO EN LA APLICACIÓN (app.js)
// ============================================
// app.use(notFoundHandler);  // Siempre después de todas las rutas
// app.use(errorHandler);     // Después de notFoundHandler

// ============================================
// ORDEN DE MIDDLEWARES EN app.js
// ============================================
// 1. Middlewares de aplicación (express.json, express.urlencoded, etc.)
// 2. Rutas de la aplicación (app.use('/', routes))
// 3. notFoundHandler (para rutas no encontradas)
// 4. errorHandler (para manejar errores)
