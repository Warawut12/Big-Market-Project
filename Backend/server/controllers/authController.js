const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

exports.adminLogin = (req, res) => {
  const { password } = req.body;
  
  // กำหนดรหัสผ่านแอดมิน 
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

  if (password === ADMIN_PASSWORD) {
    // สร้าง Token มีอายุการใช้งาน 2 ชั่วโมง
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "เข้าสู่ระบบสำเร็จ", token });
  } else {
    res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" });
  }
};