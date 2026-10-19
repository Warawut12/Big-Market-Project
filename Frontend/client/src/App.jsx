import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Image from "./components/image";
import Info from "./components/info";
import Navbar from "./components/navbar";
import Status from "./components/status";
import Footer from "./components/footer";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [scannedBookingId, setScannedBookingId] = useState("");

  useEffect(() => {
    // อ่านค่า booking_id จาก URL (เช่น ?booking_id=123) เมื่อสแกน QR Code
    const urlParams = new URLSearchParams(window.location.search);
    const bookingIdFromUrl = urlParams.get("booking_id");

    if (bookingIdFromUrl) {
      setScannedBookingId(bookingIdFromUrl);
      const token = localStorage.getItem("admin_token");
      if (token) {
        setIsAdmin(true);
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