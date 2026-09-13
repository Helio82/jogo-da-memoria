const { sign, isValidEmail, safeEqual } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const email = String((req.body || {}).email || "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Digite um e-mail válido." });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = Date.now() + 10 * 60 * 1000;
  const payload = `${email}.${code}.${exp}`;
  const sig = sign(payload);
  const token = Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Memória Mágica <onboarding@resend.dev>",
        to: [email],
        subject: `Memória Mágica — seu código: ${code}`,
        html: [
          "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px\">",
          "<h2 style=\"color:#FF7043\">Memória Mágica</h2>",
          "<p>Olá!</p>",
          "<p>Use o código abaixo para entrar no jogo:</p>",
          "<p style=\"font-size:32px;font-weight:bold;letter-spacing:8px;background:#FDF6EC;padding:12px 16px;border-radius:8px;text-align:center\">" + code + "</p>",
          "<p style=\"color:#7A6255\">O código expira em 10 minutos. Se você não pediu este código, ignore este e-mail.</p>",
          "</div>"
        ].join("")
      })
    });

    if (!resposta.ok) {
      return res.status(500).json({ error: "Não foi possível enviar o e-mail agora. Tente de novo." });
    }

    return res.status(200).json({ ok: true, token });
  } catch (e) {
    return res.status(500).json({ error: "Não foi possível enviar o e-mail agora. Tente de novo." });
  }
};
