const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");

// =============================================
// LISTAR VECINOS
// =============================================
async function getVecinos(req, res) {
  try {
    const sql = `
      SELECT id, nombre, rut, telefono, direccion, foto, 
             saldo AS saldo_actual,
             qr_url
      FROM vecinos
      ORDER BY nombre ASC;
    `;

    const { rows } = await pool.query(sql);

    res.json(rows);
  } catch (err) {
    console.error("Error getVecinos:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =============================================
// ACTUALIZAR SALDO
// =============================================
async function updateSaldo(req, res) {
  try {
    const { id } = req.params;
    const { monto } = req.body;

    const sql = `
      UPDATE vecinos
      SET saldo = $1
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(sql, [monto, id]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Error updateSaldo:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

// =============================================
// REGENERAR QR
// =============================================
async function regenerarQR(req, res) {
  try {
    const { id } = req.params;

    const qr_secret = uuidv4();
    const qrData = `caja-vecina://${qr_secret}`;

    const qr_url = await QRCode.toDataURL(qrData);

    const sql = `
      UPDATE vecinos
      SET qr_secret = $1,
          qr_url = $2
      WHERE id = $3
      RETURNING *;
    `;

    const { rows } = await pool.query(sql, [qr_secret, qr_url, id]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Error regenerarQR:", err);
    res.status(500).json({ error: "Error interno" });
  }
}

module.exports = {
  getVecinos,
  updateSaldo,
  regenerarQR,
};
