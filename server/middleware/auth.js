const { verifyToken } = require("../config/jwt");

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No autorizado. Token no enviado." });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object") {
      return res
        .status(401)
        .json({ message: "Token inválido: formato no reconocido." });
    }

    // Campos mínimos esperados
    if (!decoded.id || !decoded.rol) {
      return res.status(401).json({
        message: "Token inválido: datos incompletos.",
      });
    }

    // Normalización de usuario
    const cleanRol =
      typeof decoded.rol === "string"
        ? decoded.rol.charAt(0).toUpperCase() +
          decoded.rol.slice(1).toLowerCase()
        : "Desconocido";

    req.user = {
      id: Number(decoded.id),
      nombre: decoded.nombre || "",
      username: decoded.username || "",
      rol: cleanRol,
    };

    return next();
  } catch (err) {
    const message = err?.message || "Error desconocido al validar token";

    if (message.includes("expired")) {
      return res.status(401).json({ message: "Token expirado." });
    }

    console.error("❌ Error JWT:", message);
    return res.status(401).json({ message: "Token inválido o manipulado." });
  }
}

module.exports = { auth };
