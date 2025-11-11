const express = require("express");
const router = express.Router();
const { db } = require("../config/db");
const bcrypt = require("bcryptjs");
const { signToken } = require("../config/jwt");
const { auth } = require("../middleware/auth");


/*
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Usuario y contraseña requeridos" });

  db.query("SELECT * FROM usuarios WHERE username=? AND activo=1 LIMIT 1", [username], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!rows.length) return res.status(401).json({ message: "Credenciales inválidas" });

    const user = rows[0];
    if (!bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, username: user.username, nombre: user.nombre, correo: user.correo, rol: user.rol },
    });
  });
});
*/

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query("SELECT * FROM usuarios WHERE username = ?", [username]);
    if (!rows.length) return res.status(401).json({ error: "Usuario no encontrado" });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    console.error("❌ Error en /auth/login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



router.get("/me", auth, (req, res) => res.json({ user: req.user }));

module.exports = router;
