const { safeEqual, sign } = require("./_lib");

function readSession(req) {
  const cookies = String(req.headers.cookie || "")
    .split(";")
    .map(function (c) { return c.trim(); });

  const sess = cookies.find(function (c) { return c.startsWith("mm_session="); });
  if (!sess) return null;

  let parts;
  try {
    parts = Buffer.from(sess.slice("mm_session=".length), "base64url").toString("utf8").split("|");
  } catch (e) {
    return null;
  }

  if (parts.length !== 3) return null;
  const [em, exp, sig] = parts;
  if (!safeEqual(sig, sign(`${em}|${exp}`)) || Date.now() > Number(exp)) return null;
  return em;
}

module.exports = { readSession };
