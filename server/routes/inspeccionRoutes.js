// routes/inspeccionRoutes.js
const express = require("express");
const { db } = require("../config/db");
const auth = require("../middleware/auth");  // FIX 2

const router = express.Router();

// === OBTENER INSPECCIONES ===
router.get("/", auth, async (req, res) => {
  try {
    const user = req.user;
    const isConductor = user.rol?.toLowerCase() === "conductor";

    let sql = `
      SELECT 
        i.id,
        i.created_at AS fecha,
        u.nombre AS conductor_nombre,
        u.id AS usuario_id,
        v.patente AS vehiculo_patente,
        v.id AS vehiculo_id,
        COALESCE(i.estado, 'OK') AS estado,
        i.observacion
      FROM inspecciones i
      JOIN usuarios u ON u.id = i.usuario_id
      JOIN vehiculos v ON v.id = i.vehiculo_id
      WHERE LOWER(COALESCE(u.rol, '')) = 'conductor'
    `;

    const params = [];

    if (isConductor) {
      sql += " AND i.usuario_id = $1 ";
      params.push(user.id);
    }

    sql += " ORDER BY i.id DESC";

    const result = await db.query(sql, params);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error GET /inspecciones:", err);
    return res.status(500).json({ message: "Error al obtener inspecciones" });
  }
});

// === CREAR INSPECCIÓN ===
router.post("/", auth, async (req, res) => {
  const user = req.user;
  const { usuario_id, vehiculo_id, observacion, items, foto } = req.body;

  const isConductor = user.rol?.toLowerCase() === "conductor";

  if (!vehiculo_id) {
    return res.status(400).json({ message: "vehiculo_id es obligatorio" });
  }

  if (isConductor && Number(usuario_id) !== Number(user.id)) {
    return res.status(403).json({
      message: "Acción no permitida. Los conductores solo pueden registrar inspecciones propias.",
    });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // INSERT inspección
    const insertInspeccion = await client.query(
      `
      INSERT INTO inspecciones (usuario_id, vehiculo_id, observacion, estado, foto)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [usuario_id, vehiculo_id, observacion || "", "OK", foto || null]
    );

    const inspeccionId = insertInspeccion.rows[0].id;

    let itemRows = [];

    if (items && typeof items === "object") {
      for (const [key, val] of Object.entries(items)) {
        itemRows.push({
          inspeccion_id: inspeccionId,
          item_key: key,
          existe: val?.existe === "NO" ? "NO" : "SI",
          estado: ["Bueno", "Regular", "Malo"].includes(val?.estado)
            ? val.estado
            : "Bueno",
          obs: (val?.obs || "").slice(0, 255),
        });
      }
    }

    for (const item of itemRows) {
      await client.query(
        `
        INSERT INTO inspeccion_items (inspeccion_id, item_key, existe, estado, obs)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          item.inspeccion_id,
          item.item_key,
          item.existe,
          item.estado,
          item.obs,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      id: inspeccionId,
      items: itemRows.length,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error POST /inspecciones:", err);
    return res.status(500).json({ message: "Error al crear inspección" });
  } finally {
    client.release();
  }
});

// === OBTENER ÍTEMS DE UNA INSPECCIÓN ===
router.get("/:id/items", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;
    const isConductor = user.rol?.toLowerCase() === "conductor";

    const checkQuery = isConductor
      ? `SELECT usuario_id FROM inspecciones WHERE id = $1 AND usuario_id = $2`
      : `SELECT usuario_id FROM inspecciones WHERE id = $1`;

    const checkParams = isConductor ? [id, user.id] : [id];
    const check = await db.query(checkQuery, checkParams);

    if (check.rows.length === 0) {
      return res.status(403).json({
        message: "No tiene permiso para ver esta inspección.",
      });
    }

    const items = await db.query(
      `
      SELECT item_key, existe, estado, obs
      FROM inspeccion_items
      WHERE inspeccion_id = $1
      `,
      [id]
    );

    res.json(items.rows);

  } catch (err) {
    console.error("❌ Error GET /inspecciones/:id/items:", err);
    return res.status(500).json({ message: "Error al obtener ítems" });
  }
});

module.exports = router;
