// routes/conductorRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === Obtener todos los conductores ===
router.get("/", auth, async (_req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, username, nombre, correo, rol, activo
      FROM usuarios
      WHERE rol = 'Conductor'
      ORDER BY id DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error GET /conductores:", err);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
});

// === Crear conductor ===
router.post("/", auth, async (req, res) => {
  const { username, nombre, correo, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO usuarios (username, nombre, correo, rol, password_hash, activo)
      VALUES ($1, $2, $3, 'Conductor', $4, 1)
      RETURNING id
      `,
      [username, nombre, correo, hash]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error POST /conductores:", err);
    res.status(500).json({ message: "Error al crear conductor" });
  }
});

// === Actualizar datos conductor ===
router.put("/:id", auth, async (req, res) => {
  const { nombre, correo, activo } = req.body;

  try {
    await db.query(
      `
      UPDATE usuarios
      SET nombre = $1,
          correo = $2,
          activo = $3
      WHERE id = $4 AND rol = 'Conductor'
      `,
      [nombre, correo, activo ? true : false, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /conductores/:id:", err);
    res.status(500).json({ message: "Error al actualizar conductor" });
  }
});

// === Actualizar contraseña ===
router.put("/:id/password", auth, async (req, res) => {
  const { password } = req.body;

  if (!password)
    return res.status(400).json({ message: "Contraseña requerida" });

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `
      UPDATE usuarios
      SET password_hash = $1
      WHERE id = $2 AND rol = 'Conductor'
      `,
      [hash, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error PUT /conductores/:id/password:", err);
    res.status(500).json({ message: "Error al actualizar contraseña" });
  }
});

// === Eliminar conductor ===
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query(
      `
      DELETE FROM usuarios
      WHERE id = $1 AND rol = 'Conductor'
      `,
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error DELETE /conductores/:id:", err);
    res.status(500).json({ message: "Error al eliminar conductor" });
  }
});

module.exports = router;
