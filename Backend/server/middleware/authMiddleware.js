const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "market_secret_key_2026";

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "ไม่พบสิทธิ์การเข้าใช้งาน กรุณาเข้าสู่ระบบก่อน" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "รูปแบบ Token ไม่ถูกต้อง" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token หมดอายุหรือไม่ถูกต้อง" });
    }
    req.admin = decoded;
    next();
  });
};

module.exports = { verifyAdminToken, JWT_SECRET };