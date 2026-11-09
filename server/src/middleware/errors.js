export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let code = error.code || "INTERNAL_ERROR";
  let message = error.message;
  if (error.type === "entity.parse.failed") {
    status = 400;
    code = "INVALID_JSON";
    message = "El cuerpo debe ser JSON válido.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    code = "BODY_TOO_LARGE";
    message = "La solicitud excede el tamaño permitido.";
  } else if (status >= 500 && code !== "CONSISTENCY_REVIEW_REQUIRED") {
    console.error("REQUEST_FAILED", error.name);
    code = "INTERNAL_ERROR";
    message =
      "No se pudo completar la operación. Verifica el saldo antes de volver a intentarlo.";
  }
  res.status(status).json({ error: { code, message } });
}
