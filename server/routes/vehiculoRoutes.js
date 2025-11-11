const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER TODOS LOS VEHÍCULOS ===
router.get("/", auth, (_req, res) => {
  const sql =
    "SELECT id, numero_interno, patente, kilometro FROM vehiculos ORDER BY id DESC";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// === CREAR NUEVO VEHÍCULO ===
router.post("/", auth, (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};
  if (!numero_interno?.trim() || !patente?.trim())
    return res
      .status(400)
      .json({ message: "Campos obligatorios faltantes" });

  const sql = `
    INSERT INTO vehiculos (numero_interno, patente, kilometro)
    VALUES (?, ?, ?)
  `;
  db.query(
    sql,
    [numero_interno.trim(), patente.trim().toUpperCase(), kilometro || 0],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ id: result.insertId });
    }
  );
});

// === ACTUALIZAR VEHÍCULO ===
router.put("/:id", auth, (req, res) => {
  const { numero_interno, patente, kilometro } = req.body || {};
  if (!numero_interno?.trim() || !patente?.trim())
    return res
      .status(400)
      .json({ message: "Campos obligatorios faltantes" });

  const sql = `
    UPDATE vehiculos 
    SET numero_interno=?, patente=?, kilometro=? 
    WHERE id=?
  `;
  db.query(
    sql,
    [numero_interno.trim(), patente.trim().toUpperCase(), kilometro || 0, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!result.affectedRows)
        return res.status(404).json({ message: "Vehículo no encontrado" });
      res.json({ ok: true, updated: result.changedRows });
    }
  );
});

// === ELIMINAR VEHÍCULO (con validación de uso en reportes) ===
router.delete("/:id", auth, (req, res) => {
  const vehiculoId = req.params.id;

  // Verificar si el vehículo está en uso (en inspecciones/reportes)
  const checkSql = `
    SELECT COUNT(*) AS total
    FROM inspecciones
    WHERE vehiculo_id = ?
  `;

  db.query(checkSql, [vehiculoId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    const enUso = rows[0]?.total > 0;
    if (enUso) {
      return res.status(400).json({
        message:
          "No se puede eliminar este vehículo porque está asociado a reportes de conductores.",
      });
    }

    // Si no está en uso, proceder con la eliminación
    const deleteSql = "DELETE FROM vehiculos WHERE id=?";
    db.query(deleteSql, [vehiculoId], (delErr, result) => {
      if (delErr) return res.status(500).json({ message: delErr.message });
      if (!result.affectedRows)
        return res.status(404).json({ message: "Vehículo no encontrado" });

      res.json({ ok: true, message: "Vehículo eliminado correctamente." });
    });
  });
});

module.exports = router;
