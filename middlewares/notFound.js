export function notFoundHandler(_req, res) {
  res.status(404).render("error", {
    title: "No encontrado",
    statusCode: 404,
    errorTitle: "NOT_FOUND",
    errorMessage: "La ruta que buscas no existe."
  });
}
