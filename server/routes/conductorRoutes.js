const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, (_req, res) => {
  db.query("SELECT id,username,nombre,correo,rol,activo FROM usuarios ORDER BY id DESC",
    (err, rows) => err ? res.status(500).json({ message: err.message }) : res.json(rows)
  );
});

router.post("/", auth, (req, res) => {
  const { username, nombre, correo, rol, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "Usuario y contraseña obligatorios" });
  const hash = bcrypt.hashSync(password, 10);
  db.query(
    "INSERT INTO usuarios (username,nombre,correo,rol,password_hash,activo) VALUES (?,?,?,?,?,1)",
    [username, nombre, correo, rol, hash],
    (err, result) =>
      err ? res.status(500).json({ message: err.message }) : res.status(201).json({ id: result.insertId })
  );
});

router.put("/:id", auth, (req, res) => {
  const { nombre, correo, rol, activo } = req.body;
  db.query(
    "UPDATE usuarios SET nombre=?, correo=?, rol=?, activo=? WHERE id=?",
    [nombre, correo, rol, activo ? 1 : 0, req.params.id],
    (err) =>
      err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
  );
});

router.put("/:id/password", auth, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: "Contraseña requerida" });
  const hash = bcrypt.hashSync(password, 10);
  db.query("UPDATE usuarios SET password_hash=? WHERE id=?", [hash, req.params.id],
    (err) => err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
  );
});

router.delete("/:id", auth, (req, res) => {
  db.query("DELETE FROM usuarios WHERE id=?", [req.params.id],
    (err) => err ? res.status(500).json({ message: err.message }) : res.json({ ok: true })
  );
});

module.exports = router;
