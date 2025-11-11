const express = require("express");
const bcrypt = require("bcryptjs");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER TODOS LOS USUARIOS ===
router.get("/", auth, (_req, res) => {
  const sql = `
    SELECT 
      id, username, nombre, correo, rol, activo,
      rut, direccion, telefono, licencia, departamento
    FROM usuarios
    ORDER BY id DESC
  `;
  db.query(sql, (err, rows) =>
    err
      ? res.status(500).json({ message: err.message })
      : res.json(rows || [])
  );
});

// === OBTENER SOLO CONDUCTORES ACTIVOS ===
router.get("/conductores", auth, (_req, res) => {
  const sql = `
    SELECT 
      id, username, nombre, correo, rol, activo,
      rut, direccion, telefono, licencia, departamento
    FROM usuarios
    WHERE LOWER(rol)='conductor' AND activo=1
    ORDER BY nombre ASC
  `;
  db.query(sql, (err, rows) =>
    err
      ? res.status(500).json({ message: err.message })
      : res.json(rows || [])
  );
});

// === CREAR NUEVO USUARIO ===
router.post("/", auth, (req, res) => {
  const {
    username,
    nombre,
    correo,
    rut,
    direccion,
    telefono,
    licencia,
    departamento,
    rol,
    password,
  } = req.body || {};

  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Usuario y contraseña son obligatorios" });

  const hash = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO usuarios (
      username, nombre, correo, rut, direccion, telefono, licencia, departamento,
      rol, password_hash, activo
    ) VALUES (?,?,?,?,?,?,?,?,?,?,1)
  `;
  const params = [
    username,
    nombre || "",
    correo || "",
    rut || "",
    direccion || "",
    telefono || "",
    licencia || "",
    departamento || "Municipalidad",
    rol || "Usuario",
    hash,
  ];

  db.query(sql, params, (err, result) =>
    err
      ? res.status(500).json({ message: err.message })
      : res.status(201).json({ id: result.insertId })
  );
});

// === ACTUALIZAR DATOS DEL USUARIO ===
router.put("/:id", auth, (req, res) => {
  const {
    nombre,
    correo,
    rut,
    direccion,
    telefono,
    licencia,
    departamento,
    rol,
    activo,
  } = req.body || {};

  const sql = `
    UPDATE usuarios SET
      nombre=?,
      correo=?,
      rut=?,
      direccion=?,
      telefono=?,
      licencia=?,
      departamento=?,
      rol=?,
      activo=?
    WHERE id=?
  `;
  const params = [
    nombre || "",
    correo || "",
    rut || "",
    direccion || "",
    telefono || "",
    licencia || "",
    departamento || "Municipalidad",
    rol || "Usuario",
    activo ? 1 : 0,
    req.params.id,
  ];

  db.query(sql, params, (err) =>
    err
      ? res.status(500).json({ message: err.message })
      : res.json({ ok: true })
  );
});

// === CAMBIAR CONTRASEÑA ===
router.put("/:id/password", auth, (req, res) => {
  const { password } = req.body || {};
  if (!password)
    return res.status(400).json({ message: "Contraseña requerida" });

  const hash = bcrypt.hashSync(password, 10);
  db.query(
    "UPDATE usuarios SET password_hash=? WHERE id=?",
    [hash, req.params.id],
    (err) =>
      err
        ? res.status(500).json({ message: err.message })
        : res.json({ ok: true })
  );
});

// === ELIMINAR USUARIO ===
router.delete("/:id", auth, (req, res) => {
  db.query("DELETE FROM usuarios WHERE id=?", [req.params.id], (err) =>
    err
      ? res.status(500).json({ message: err.message })
      : res.json({ ok: true })
  );
});

module.exports = router;
