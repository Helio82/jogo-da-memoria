const { readSession } = require("./_session");

module.exports = async (req, res) => {
  return res.status(200).json({ email: readSession(req) });
};
