import { pool } from "../config/db.js";
import crypto from "crypto";

// =========================
// LISTAR VECINOS
// =========================
export async function getVecinos(req, res) {
  try {
    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.rut,
        u.telefono,
        u.avatar_base64 AS foto,
        w.saldo_actual,
        (
          SELECT token
          FROM qr_tokens
          WHERE vecino_id = u.id
          ORDER BY expires_at DESC
          LIMIT 1
        ) AS qr_token
      FROM usuarios u
      JOIN vecinos_wallet w ON w.vecino_id = u.id
      WHERE u.rol = 'vecino'
      ORDER BY u.nombre;
    `;

    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error getVecinos:", error);
    return res.status(500).json({ message: "Error interno" });
  }
}

// =========================
// ACTUALIZAR SALDO
// =========================
export async function updateSaldo(req, res) {
  try {
    const { id } = req.params;
    const { monto } = req.body;

    const query = `
      UPDATE vecinos_wallet
      SET saldo_actual = $2, updated_at = NOW()
      WHERE vecino_id = $1
      RETURNING *;
    `;

    const result = await pool.query(query, [id, monto]);

    return res.json({
      message: "Saldo actualizado",
      wallet: result.rows[0],
    });

  } catch (error) {
    console.error("Error updateSaldo:", error);
    return res.status(500).json({ message: "Error interno" });
  }
}

// =========================
// REGENERAR QR
// =========================
export async function regenerarQR(req, res) {
  try {
    const { id } = req.params;

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60_000); // 1 minuto

    const query = `
      INSERT INTO qr_tokens (vecino_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING token;
    `;

    const result = await pool.query(query, [id, token, expires]);

    return res.json({
      message: "QR regenerado",
      token: result.rows[0].token,
    });

  } catch (error) {
    console.error("Error regenerarQR:", error);
    return res.status(500).json({ message: "Error interno" });
  }
}
