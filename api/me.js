const { safeEqual } = require("./_lib");

module.exports = async (req, res) => {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map(function (c) { return c.trim(); });

  const sess = cookies.find(function (c) { return c.startsWith("mm_session="); });
  if (!sess) {
    return res.status(200).json({ email: null });
  }

  const token = sess.slice("mm_session=".length);
  let parts;
  try {
    parts = Buffer.from(token, "base64url").toString("utf8").split(".");
  } catch (e) {
    return res.status(200).json({ email: null });
  }

  if (parts.length !== 3) {
    return res.status(200).json({ email: null });
  }

  const [em, exp, sig] = parts;
  if (!safeEqual(sig, require("./_lib").sign(`${em}.${exp}`)) || Date.now() > Number(exp)) {
    return res.status(200).json({ email: null });
  }

  return res.status(200).json({ email: em });
};
