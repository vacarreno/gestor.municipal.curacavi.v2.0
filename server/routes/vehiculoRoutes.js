// routes/vehiculoRoutes.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// ============================================================
// =============== OBTENER TODOS LOS VEHÍCULOS =================
// ============================================================
router.get("/", auth, async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT id, numero_interno, patente, kilometro 
      FROM vehiculos 
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error GET /vehiculos:", err);
    res.status(500).json({ message: "Error al obtener vehículos" });
  }
});

// ============================================================
// ==================== CREAR VEHÍCULO =========================
// ============================================================
router.post("/", auth, async (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};

  if (!numero_interno?.trim() || !patente?.trim()) {
    return res.status(400).json({ message: "Campos obligatorios faltantes" });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO vehiculos (numero_interno, patente, kilometro)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [numero_interno.trim(), patente.trim().toUpperCase(), kilometro || 0]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Error POST /vehiculos:", err);
    res.status(500).json({ message: "Error al crear vehículo" });
  }
});

// ============================================================
// ==================== ACTUALIZAR VEHÍCULO ====================
// ============================================================
router.put("/:id", auth, async (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};

  if (!numero_interno?.trim() || !patente?.trim()) {
    return res.status(400).json({ message: "Campos obligatorios faltantes" });
  }

  try {
    const result = await db.query(
      `
      UPDATE vehiculos
      SET numero_interno=$1, patente=$2, kilometro=$3
      WHERE id=$4
      `,
      [
        numero_interno.trim(),
        patente.trim().toUpperCase(),
        kilometro || 0,
        req.params.id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    res.json({ ok: true, updated: result.rowCount });
  } catch (err) {
    console.error("❌ Error PUT /vehiculos/:id:", err);
    res.status(500).json({ message: "Error al actualizar vehículo" });
  }
});

// ============================================================
// =============== ELIMINAR VEHÍCULO ===========================
// ============================================================
router.delete("/:id", auth, async (req, res) => {
  const vehiculoId = req.params.id;

  try {
    // Verificar si está en uso
    const check = await db.query(
      "SELECT COUNT(*)::int AS total FROM inspecciones WHERE vehiculo_id = $1",
      [vehiculoId]
    );

    const enUso = check.rows[0]?.total > 0;
    if (enUso) {
      return res.status(400).json({
        message:
          "No se puede eliminar este vehículo porque está asociado a inspecciones.",
      });
    }

    // Eliminar
    const result = await db.query(
      "DELETE FROM vehiculos WHERE id=$1",
      [vehiculoId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }

    res.json({ ok: true, message: "Vehículo eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error DELETE /vehiculos/:id:", err);
    res.status(500).json({ message: "Error al eliminar vehículo" });
  }
});

module.exports = router;
