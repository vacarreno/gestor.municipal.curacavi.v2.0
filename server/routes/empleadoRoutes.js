// routes/empleadoRoutes.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === Crear empleado ===
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, edad, pais, cargo, anios } = req.body;

    if (!nombre || !edad || !pais || !cargo) {
      return res.status(400).json({ message: "Datos obligatorios incompletos" });
    }

    const result = await db.query(
      `
      INSERT INTO empleados (nombre, edad, pais, cargo, anios)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [nombre, edad, pais, cargo, anios || 0]
    );

    res.status(201).json({ id: result.rows[0].id });

  } catch (err) {
    console.error("❌ Error POST /empleados:", err);
    res.status(500).json({ message: "Error al crear empleado" });
  }
});

// === Listar empleados ===
router.get("/", auth, async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM empleados
      ORDER BY id DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error GET /empleados:", err);
    res.status(500).json({ message: "Error al listar empleados" });
  }
});

module.exports = router;
