const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === LISTAR TODAS LAS MANTENCIONES ===
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id, m.tipo, m.fecha, m.observacion, m.costo,
        v.patente AS vehiculo_patente, v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      ORDER BY m.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error listando mantenciones:", err);
    res.status(500).json({ message: "Error al listar mantenciones" });
  }
});

// === OBTENER DETALLE DE UNA MANTENCIÓN ===
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [[mantencion]] = await db.query(
      "SELECT * FROM mantenciones WHERE id = ?",
      [id]
    );
    if (!mantencion)
      return res.status(404).json({ message: "Mantención no encontrada" });

    const [items] = await db.query(
      "SELECT * FROM mantencion_items WHERE mantencion_id = ?",
      [id]
    );

    res.json({ ...mantencion, items });
  } catch (err) {
    console.error("❌ Error obteniendo mantención:", err);
    res.status(500).json({ message: "Error al obtener mantención" });
  }
});

// === CREAR MANTENCIÓN (con ítems) ===
router.post("/", auth, async (req, res) => {
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } =
    req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1️⃣ Insertar mantención
    const [result] = await conn.query(
      `
      INSERT INTO mantenciones 
      (vehiculo_id, usuario_id, tipo, observacion, costo, fecha)
      VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [vehiculo_id, usuario_id || null, tipo, observacion || "", costo || 0]
    );

    const mantencionId = result.insertId;

    // 2️⃣ Insertar ítems
    if (items.length > 0) {
      const values = items.map((i) => [
        mantencionId,
        i.item,
        i.tipo || "Tarea",
        i.cantidad || 1,
        i.costo_unitario || 0,
      ]);
      await conn.query(
        `
        INSERT INTO mantencion_items 
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ?
        `,
        [values]
      );
    }

    await conn.commit();
    conn.release();
    res.status(201).json({ id: mantencionId, message: "Mantención creada correctamente" });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Error creando mantención:", err);
    res.status(500).json({ message: "Error al crear mantención" });
  }
});

// === ACTUALIZAR MANTENCIÓN ===
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } =
    req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1️⃣ Actualizar datos generales
    await conn.query(
      `
      UPDATE mantenciones
      SET vehiculo_id=?, usuario_id=?, tipo=?, observacion=?, costo=?
      WHERE id=?
      `,
      [vehiculo_id, usuario_id || null, tipo, observacion || "", costo || 0, id]
    );

    // 2️⃣ Eliminar ítems anteriores
    await conn.query("DELETE FROM mantencion_items WHERE mantencion_id=?", [id]);

    // 3️⃣ Insertar nuevos ítems
    if (items.length > 0) {
      const values = items.map((i) => [
        id,
        i.item,
        i.tipo || "Tarea",
        i.cantidad || 1,
        i.costo_unitario || 0,
      ]);
      await conn.query(
        `
        INSERT INTO mantencion_items 
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ?
        `,
        [values]
      );
    }

    await conn.commit();
    conn.release();
    res.json({ message: "Mantención actualizada correctamente" });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error("❌ Error actualizando mantención:", err);
    res.status(500).json({ message: "Error al actualizar mantención" });
  }
});

// === ELIMINAR MANTENCIÓN ===
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM mantenciones WHERE id=?", [id]);
    res.json({ message: "Mantención eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando mantención:", err);
    res.status(500).json({ message: "Error al eliminar mantención" });
  }
});

module.exports = router;
