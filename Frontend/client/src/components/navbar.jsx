import { useState } from "react";
import axios from "axios";
import API from "../utils/axios";

function Navbar({ isAdmin, setIsAdmin }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAdminToggle = () => {
    if (isAdmin) {
      localStorage.removeItem("admin_token"); 
      setIsAdmin(false);
    } else {
      setErrorMsg("");
      setPassword("");
      setShowModal(true);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      //  ส่งรหัสผ่านไปตรวจสอบที่ หลังบ้าน
      const response = await API.post("/api/auth/login", { password });
      
      // บันทึก Token ลงใน LocalStorage
      localStorage.setItem("admin_token", response.data.token);
      
      setIsAdmin(true);
      setShowModal(false);
      setPassword("");
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div>
      <nav className="bg-neutral-secondary-soft fixed w-full z-20 top-0 start-0 border border-gray-200 rounded-xl shadow-lg bg-gray-200">
        <header className="my-1">
          <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsAdmin(false);
              }}
              className="flex items-center space-x-3 rtl:space-x-reverse"
            >
              <span className="self-center text-3xl text-heading font-semibold whitespace-nowrap text-orange-600">
                ตลาดนัดตรีสุข
              </span>
            </a>
            <div className="hidden w-full md:block md:w-auto" id="navbar-solid">
              <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-default rounded-base bg-neutral-secondary-soft md:flex-row md:space-x-4 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-neutral-secondary-soft items-center">
                <li>
                  <a
                    href="https://www.facebook.com/profile.php?id=100062768296396"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white bg-orange-600 box-border border border-transparent hover:bg-orange-700 focus:ring-4 shadow-xs font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleAdminToggle}
                    className="text-white bg-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center transition"
                  >
                    {isAdmin
                      ? "ไปหน้าผู้ใช้ทั่วไป"
                      : "เข้าสู่ระบบ"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>
      </nav>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">เข้าสู่ระบบ</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-500 text-2xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-800"
                />
              </div>

              {errorMsg && (
                <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 shadow transition"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;