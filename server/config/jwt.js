const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// === Generar token ===
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,                 // requerido por auth y rutas
      sub: user.id,                // estándar JWT
      username: user.username,
      nombre: user.nombre || "",
      rol: user.rol || "Usuario",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// === Validar token ===
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
