// ================== PostgreSQL Pool ==================
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT || 5432,
  ssl: {
    rejectUnauthorized: false, // requerido para Render.com
  },
});

// Test inicial de conexión
pool.connect()
  .then(client => {
    console.log("✅ PostgreSQL conectado");
    client.release();
  })
  .catch(err => console.error("❌ Error PostgreSQL:", err));

module.exports = {
  db: pool,
};
