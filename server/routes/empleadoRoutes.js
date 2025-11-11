const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Crear
router.post("/", auth, (req, res) => {
  const { nombre, edad, pais, cargo, anios } = req.body;
  db.query(
    "INSERT INTO empleados (nombre,edad,pais,cargo,anios) VALUES (?,?,?,?,?)",
    [nombre, edad, pais, cargo, anios],
    (err, result) =>
      err ? res.status(500).json({ message: err.message }) : res.status(201).json({ id: result.insertId })
  );
});

// Listar
router.get("/", auth, (_req, res) => {
  db.query("SELECT * FROM empleados ORDER BY id DESC", (err, rows) =>
    err ? res.status(500).json({ message: err.message }) : res.json(rows)
  );
});

module.exports = router;
