// app.js - Punto de entrada de la aplicación

// Importa Express para crear el servidor web
import express from "express";

// Importa express-session para manejar sesiones de usuario
import session from "express-session";

// Importa path para manejar rutas de archivos
import path from "path";

// Importa utilidades para obtener __dirname en módulos ES6
import { fileURLToPath } from "url";

// Importa configuración de la aplicación (puerto, etc.)
import { appConfig } from "./config/config.js";

// Importa función para conectar a MongoDB
import { connectDatabase } from "./config/database.js";

// Importa todas las rutas de la aplicación
import webRoutes from "./routes/index.js";

// Importa middleware para manejar rutas no encontradas (404)
import { notFoundHandler } from "./middlewares/notFound.js";

// Importa middleware para manejar errores
import { errorHandler } from "./middlewares/errorHandler.js";

// Obtiene la ruta del archivo actual en ES modules
const __filename = fileURLToPath(import.meta.url);

// Obtiene el directorio del archivo actual
const __dirname = path.dirname(__filename);

// Crea la instancia de la aplicación Express
const app = express();

// Configura el motor de vistas Pug
app.set("view engine", "pug");

// Configura la carpeta donde están las vistas
app.set("views", path.join(__dirname, "views"));

// Middleware para parsear datos de formularios (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Middleware para parsear JSON (application/json)
app.use(express.json());

app.set("trust proxy", 1);

// Middleware para manejar sesiones
app.use(session({
  name: appConfig.sessionCookieName,
  secret: appConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: appConfig.isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

// Middleware para exponer datos de sesión en todas las vistas
app.use((req, res, next) => {
  const currentUser = req.session?.auth || null;
  res.locals.isAuthenticated = Boolean(currentUser);
  res.locals.currentUser = currentUser;
  res.locals.currentRole = currentUser?.role || null;
  res.locals.currentComercioId = currentUser?.comercioId || null;
  res.locals.currentTiendaId = currentUser?.tiendaId || null;
  res.locals.isPlatformAdmin = currentUser?.role === "PLATFORM_ADMIN";
  res.locals.isCommerceAdmin = currentUser?.role === "COMMERCE_ADMIN";
  res.locals.isCommerceUser = currentUser?.role === "COMMERCE_USER";
  next();
});

// Middleware para servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, "public")));

// Ruta de verificación de salud (health check)
app.get("/health", (_req, res) => {
  // Responde con JSON indicando que el servidor está funcionando
  res.status(200).json({ success: true, data: { status: "ok" } });
});

// Monta todas las rutas de la aplicación (definidas en routes/index.js)
app.use(webRoutes);

// Middleware para manejar rutas no encontradas (404)
// Siempre después de todas las rutas
app.use(notFoundHandler);

// Middleware para manejar errores
// Siempre al final de todos los middlewares
app.use(errorHandler);

// Conecta a MongoDB y luego inicia el servidor
connectDatabase()
  .then(() => {
    // Inicia el servidor en el puerto configurado
    app.listen(appConfig.port, () => {
      console.log(`Servidor en http://localhost:${appConfig.port}`);
    });
  })
  .catch((error) => {
    // Si falla la conexión a MongoDB, muestra error y termina el proceso
    console.error("Error al conectar MongoDB", error);
    process.exit(1);  // Sale de la aplicación con código de error
  });
