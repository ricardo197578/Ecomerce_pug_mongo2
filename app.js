import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { appConfig } from "./config/config.js";
import { connectDatabase } from "./config/database.js";
import webRoutes from "./routes/index.js";
import { notFoundHandler } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: "codenova-dev-session-secret",
  resave: false,
  saveUninitialized: false
}));
app.use((req, res, next) => {
  res.locals.isPlatformAdmin = Boolean(req.session?.isPlatformAdmin);
  next();
});
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

app.use(webRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

connectDatabase()
  .then(() => {
    app.listen(appConfig.port, () => {
      console.log(`Servidor en http://localhost:${appConfig.port}`);
    });
  })
  .catch((error) => {
    console.error("Error al conectar MongoDB", error);
    process.exit(1);
  });
