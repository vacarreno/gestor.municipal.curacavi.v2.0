const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// === OBTENER INSPECCIONES (solo propias si es Conductor) ===
router.get("/", auth, (req, res) => {
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
    sql += " AND i.usuario_id = ? ";
    params.push(user.id);
  }

  sql += " ORDER BY i.id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// === CREAR INSPECCIÓN ===
router.post("/", auth, (req, res) => {
  const user = req.user;
  const isConductor = user.rol?.toLowerCase() === "conductor";
  const { usuario_id, vehiculo_id, observacion, items, foto } = req.body;

  if (!vehiculo_id)
    return res.status(400).json({ message: "vehiculo_id es obligatorio" });

  if (isConductor && Number(usuario_id) !== Number(user.id)) {
    return res.status(403).json({
      message:
        "Acción no permitida. Los conductores solo pueden registrar inspecciones propias.",
    });
  }

  db.getConnection((err, conn) => {
    if (err) return res.status(500).json({ message: "Error de conexión DB" });

    conn.beginTransaction((txErr) => {
      if (txErr) {
        conn.release();
        return res.status(500).json({ message: txErr.message });
      }

      conn.query(
        "INSERT INTO inspecciones (usuario_id, vehiculo_id, observacion, estado, foto) VALUES (?,?,?,?,?)",
        [usuario_id, vehiculo_id, observacion || "", "OK", foto || null],
        (e1, r1) => {
          if (e1)
            return conn.rollback(() => {
              conn.release();
              res.status(500).json({ message: e1.message });
            });

          const id = r1.insertId;
          const rows = [];

          if (items && typeof items === "object") {
            for (const [key, val] of Object.entries(items)) {
              rows.push([
                id,
                key,
                val?.existe === "NO" ? "NO" : "SI",
                ["Bueno", "Regular", "Malo"].includes(val?.estado)
                  ? val.estado
                  : "Bueno",
                (val?.obs || "").slice(0, 255),
              ]);
            }
          }

          if (!rows.length) {
            return conn.commit((errC) => {
              conn.release();
              return errC
                ? res.status(500).json({ message: errC.message })
                : res.status(201).json({ id });
            });
          }

          conn.query(
            "INSERT INTO inspeccion_items (inspeccion_id, item_key, existe, estado, obs) VALUES ?",
            [rows],
            (e2) => {
              if (e2)
                return conn.rollback(() => {
                  conn.release();
                  res.status(500).json({ message: e2.message });
                });

              conn.commit((errC) => {
                conn.release();
                return errC
                  ? res.status(500).json({ message: errC.message })
                  : res.status(201).json({ id, items: rows.length });
              });
            }
          );
        }
      );
    });
  });
});

// === OBTENER ÍTEMS DE UNA INSPECCIÓN ===
router.get("/:id/items", auth, (req, res) => {
  const id = req.params.id;
  const user = req.user;
  const isConductor = user.rol?.toLowerCase() === "conductor";

  const checkSql = isConductor
    ? "SELECT usuario_id FROM inspecciones WHERE id=? AND usuario_id=?"
    : "SELECT usuario_id FROM inspecciones WHERE id=?";
  const params = isConductor ? [id, user.id] : [id];

  db.query(checkSql, params, (checkErr, checkRows) => {
    if (checkErr) return res.status(500).json({ message: checkErr.message });
    if (!checkRows.length)
      return res
        .status(403)
        .json({ message: "No tiene permiso para ver esta inspección." });

    db.query(
      "SELECT item_key, existe, estado, obs FROM inspeccion_items WHERE inspeccion_id=?",
      [id],
      (err, rows) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(rows);
      }
    );
  });
});

module.exports = router;
