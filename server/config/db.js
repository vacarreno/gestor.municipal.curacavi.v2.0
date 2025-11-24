// config/db.js
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL no está definida");
  process.exit(1);
}

console.log("🔌 Conectando a PostgreSQL...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test
pool.connect()
  .then((client) => {
    console.log("✅ PostgreSQL conectado correctamente");
    client.release();
  })
  .catch((err) => {
    console.error("❌ Error PostgreSQL:", err);
  });

module.exports = { db: pool };

