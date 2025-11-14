// routes/mantencionesRoutes.js
const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// =============================================================
// ============ LISTAR TODAS LAS MANTENCIONES ==================
// =============================================================
router.get("/", auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.id, m.tipo, m.fecha, m.observacion, m.costo,
        v.patente AS vehiculo_patente, v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      ORDER BY m.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error listando mantenciones:", err);
    res.status(500).json({ message: "Error al listar mantenciones" });
  }
});

// =============================================================
// ============ OBTENER DETALLE DE UNA MANTENCIÓN ==============
// =============================================================
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const mantencionResult = await db.query(
      "SELECT * FROM mantenciones WHERE id = $1",
      [id]
    );

    if (mantencionResult.rows.length === 0)
      return res.status(404).json({ message: "Mantención no encontrada" });

    const mantencion = mantencionResult.rows[0];

    const itemsResult = await db.query(
      "SELECT * FROM mantencion_items WHERE mantencion_id = $1",
      [id]
    );

    res.json({ ...mantencion, items: itemsResult.rows });
  } catch (err) {
    console.error("❌ Error obteniendo mantención:", err);
    res.status(500).json({ message: "Error al obtener mantención" });
  }
});

// =============================================================
// ============ CREAR MANTENCIÓN (con ítems) ===================
// =============================================================
router.post("/", auth, async (req, res) => {
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } =
    req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Insertar mantención
    const result = await client.query(
      `
      INSERT INTO mantenciones 
      (vehiculo_id, usuario_id, tipo, observacion, costo, fecha)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
      `,
      [vehiculo_id, usuario_id || null, tipo, observacion || "", costo || 0]
    );

    const mantencionId = result.rows[0].id;

    // 2️⃣ Insertar ítems (PostgreSQL batch con VALUES ($1,$2,$3...))
    if (items.length > 0) {
      const values = [];
      const params = [];

      items.forEach((i, index) => {
        const baseIndex = index * 5;
        values.push(
          `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`
        );

        params.push(
          mantencionId,
          i.item,
          i.tipo || "Tarea",
          i.cantidad || 1,
          i.costo_unitario || 0
        );
      });

      await client.query(
        `
        INSERT INTO mantencion_items
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ${values.join(", ")}
        `,
        params
      );
    }

    await client.query("COMMIT");
    res.status(201).json({
      id: mantencionId,
      message: "Mantención creada correctamente",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error creando mantención:", err);
    res.status(500).json({ message: "Error al crear mantención" });
  } finally {
    client.release();
  }
});

// =============================================================
// ============ ACTUALIZAR MANTENCIÓN ==========================
// =============================================================
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { vehiculo_id, usuario_id, tipo, observacion, costo, items = [] } =
    req.body;

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Actualizar datos
    await client.query(
      `
      UPDATE mantenciones
      SET vehiculo_id=$1, usuario_id=$2, tipo=$3, observacion=$4, costo=$5
      WHERE id=$6
      `,
      [
        vehiculo_id,
        usuario_id || null,
        tipo,
        observacion || "",
        costo || 0,
        id,
      ]
    );

    // 2️⃣ Limpiar ítems anteriores
    await client.query(
      "DELETE FROM mantencion_items WHERE mantencion_id = $1",
      [id]
    );

    // 3️⃣ Insertar nuevos ítems
    if (items.length > 0) {
      const values = [];
      const params = [];

      items.forEach((i, index) => {
        const baseIndex = index * 5;
        values.push(
          `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`
        );

        params.push(
          id,
          i.item,
          i.tipo || "Tarea",
          i.cantidad || 1,
          i.costo_unitario || 0
        );
      });

      await client.query(
        `
        INSERT INTO mantencion_items
        (mantencion_id, item, tipo, cantidad, costo_unitario)
        VALUES ${values.join(", ")}
        `,
        params
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Mantención actualizada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error actualizando mantención:", err);
    res.status(500).json({ message: "Error al actualizar mantención" });
  } finally {
    client.release();
  }
});

// =============================================================
// ============ ELIMINAR MANTENCIÓN ============================
// =============================================================
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM mantenciones WHERE id = $1", [id]);
    res.json({ message: "Mantención eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando mantención:", err);
    res.status(500).json({ message: "Error al eliminar mantención" });
  }
});

module.exports = router;
