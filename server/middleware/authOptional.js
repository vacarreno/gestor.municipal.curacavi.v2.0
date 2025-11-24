// middleware/authOptional.js
const jwt = require("jsonwebtoken");

function authOptional(req, res, next) {
  let token = null;

  // Token por query (?token=xxx)
  if (req.query?.token) {
    token = req.query.token;
  }

  // Token estándar por headers
  if (!token && req.headers.authorization) {
    const hdr = req.headers.authorization;
    if (hdr.startsWith("Bearer ")) {
      token = hdr.slice(7);
    }
  }

  // Si no hay token, deja pasar (PDF público)
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // validación mínima
    req.user = {
      id: decoded.id || null,
      username: decoded.username || null,
      rol: decoded.rol || null,
    };
  } catch (err) {
    console.warn("authOptional: token inválido, se permite acceso público");
  }

  return next();
}

module.exports = { authOptional };
