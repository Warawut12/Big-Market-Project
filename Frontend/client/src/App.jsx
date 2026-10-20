import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Image from "./components/image";
import Info from "./components/info";
import Navbar from "./components/navbar";
import Status from "./components/status";
import Footer from "./components/footer";
import API from "./utils/axios";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [scannedBookingId, setScannedBookingId] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingIdFromUrl = urlParams.get("booking_id");

    if (bookingIdFromUrl) {
      setScannedBookingId(bookingIdFromUrl);
      const token = localStorage.getItem("admin_token");

      if (token) {
        // ทดสอบยิง API เช็กว่า Token ยังใช้งานได้อยู่หรือไม่ (ไม่หมดอายุ)
        API.get("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(() => {
            // ถ้า Token ยังใช้ได้ ให้เข้าหน้า Admin ทันที
            setIsAdmin(true);
          })
          .catch(() => {
            // ถ้า Token หมดอายุหรือไม่ถูกต้อง ให้เคลียร์ทิ้ง และปล่อยให้ Navbar เปิดหน้า Login
            localStorage.removeItem("admin_token");
            setIsAdmin(false);
          });
      }
    }
  }, []);

  return (
    <>
      <Navbar 
        isAdmin={isAdmin} 
        setIsAdmin={setIsAdmin} 
        scannedBookingId={scannedBookingId} 
      />
      {isAdmin ? (
        <AdminDashboard initialSearchQuery={scannedBookingId} />
      ) : (
        <>
          <Info />
          <Image />
          <Status />
          {/* <Footer /> */}
        </>
      )}
    </>
  );
};

export default App;