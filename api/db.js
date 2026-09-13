let pool = null;
let ready = null;

function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1
    });
  }
  return pool;
}

function ensureSchema() {
  if (!ready) {
    ready = getPool().query(
      "CREATE TABLE IF NOT EXISTS progresso (" +
        "email text NOT NULL," +
        "theme text NOT NULL," +
        "level text NOT NULL," +
        "stars int NOT NULL DEFAULT 1," +
        "plays int NOT NULL DEFAULT 1," +
        "updated_at timestamptz NOT NULL DEFAULT now()," +
        "PRIMARY KEY (email, theme, level))"
    );
  }
  return ready;
}

module.exports = { getPool, ensureSchema };
