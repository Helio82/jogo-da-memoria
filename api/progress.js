const { ensureSchema, getPool } = require("./db");
const { readSession } = require("./_session");

const THEMES = ["floresta", "dinos", "mar", "escola", "frutas"];
const LEVELS = ["facil", "medio", "dificil"];

module.exports = async (req, res) => {
  const email = readSession(req);
  if (!email) {
    return res.status(401).json({ error: "Entre com o e-mail primeiro." });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Banco de dados ainda não configurado." });
  }

  try {
    await ensureSchema();

    if (req.method === "GET") {
      const { rows } = await getPool().query(
        "SELECT theme, level, stars FROM progresso WHERE email = $1",
        [email]
      );
      return res.status(200).json({ progress: rows });
    }

    if (req.method === "POST") {
      const { theme, level, stars } = req.body || {};
      const s = Number(stars);
      if (THEMES.indexOf(theme) === -1 || LEVELS.indexOf(level) === -1 || !(s >= 1 && s <= 3)) {
        return res.status(400).json({ error: "Dados de progresso inválidos." });
      }
      await getPool().query(
        "INSERT INTO progresso (email, theme, level, stars, plays) VALUES ($1, $2, $3, $4, 1) " +
          "ON CONFLICT (email, theme, level) DO UPDATE SET " +
          "stars = GREATEST(progresso.stars, EXCLUDED.stars), " +
          "plays = progresso.plays + 1, updated_at = now()",
        [email, theme, level, s]
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao salvar progresso." });
  }
};
