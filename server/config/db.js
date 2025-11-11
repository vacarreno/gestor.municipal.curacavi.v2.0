// config/db.js
require("dotenv").config();
const mysql = require("mysql2");

// === Validación mínima de env ===
const requiredVars = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
requiredVars.forEach((v) => {
  if (!process.env[v]) {
    console.warn(`⚠️  Falta variable de entorno: ${v}`);
  }
});

// === POOL (requerido para transacciones y concurrencia) ===
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // puedes subir a 30 si hay mucha actividad
  queueLimit: 0,
});

// === Promisified pool (opcional, para async/await) ===
const promisePool = db.promise();

// === Logging ===
if (process.env.NODE_ENV !== "production") {
  console.log("=== DB CONFIG ===");
  console.log("HOST:", process.env.DB_HOST);
  console.log("DB:", process.env.DB_NAME);
  console.log("=================");
}

// === Test de conexión ===
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error al conectar DB:", err.code, err.sqlMessage || "");
  } else {
    console.log("✅ Conexión a la base de datos establecida");
    conn.release();
  }
});

// === Manejo de caída de conexión (auto-recovery) ===
db.on("error", (err) => {
  console.error("⚠️  Error de conexión MySQL:", err.code);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.warn("🔄 Intentando reconectar base de datos...");
  }
});

module.exports = { db, promisePool };
