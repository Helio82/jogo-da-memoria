module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }
  res.setHeader("Set-Cookie", "mm_session=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/");
  return res.status(200).json({ ok: true });
};
