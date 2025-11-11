const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "10m";

function signToken(user) {
  // Incluye id, nombre y rol directamente
  return jwt.sign(
    {
      id: user.id,            // ← NECESARIO para req.user.id
      sub: user.id,
      username: user.username,
      nombre: user.nombre || "",
      rol: user.rol,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
