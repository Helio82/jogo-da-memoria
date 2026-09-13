const { sign, safeEqual } = require("./_lib");

const attempts = new Map();
const MAX_ATTEMPTS = 5;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, code, token } = req.body || {};
  if (!email || !code || !token) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  let decoded;
  try {
    decoded = Buffer.from(String(token), "base64url").toString("utf8");
  } catch (e) {
    return res.status(400).json({ error: "Token inválido. Peça um código novo." });
  }

  const parts = decoded.split(".");
  if (parts.length !== 4) {
    return res.status(400).json({ error: "Token inválido. Peça um código novo." });
  }
  const [em, cd, exp, sig] = parts;

  if (!safeEqual(sig, sign(`${em}.${cd}.${exp}`))) {
    return res.status(400).json({ error: "Token inválido. Peça um código novo." });
  }

  const limiterKey = em + "." + String(token).slice(-8);
  const used = attempts.get(limiterKey) || 0;
  if (used >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Muitas tentativas. Peça um código novo." });
  }

  if (em !== String(email).trim().toLowerCase()) {
    return res.status(400).json({ error: "E-mail não corresponde." });
  }

  if (Date.now() > Number(exp)) {
    attempts.delete(limiterKey);
    return res.status(400).json({ error: "Código expirado. Peça um código novo." });
  }

  if (!safeEqual(cd, String(code))) {
    attempts.set(limiterKey, used + 1);
    return res.status(400).json({ error: "Código incorreto. Confira e tente de novo." });
  }

  attempts.delete(limiterKey);

  const sessExp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const sessPayload = `${em}.${sessExp}`;
  const sessSig = sign(sessPayload);
  const sess = Buffer.from(`${sessPayload}.${sessSig}`, "utf8").toString("base64url");

  res.setHeader("Set-Cookie", `mm_session=${sess}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`);
  return res.status(200).json({ ok: true, email: em });
};
