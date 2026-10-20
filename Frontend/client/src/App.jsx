import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Image from "./components/image";
import Info from "./components/info";
import Navbar from "./components/navbar";
import Status from "./components/status";
import Footer from "./components/footer";
import API from "../utils/axios";

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
        
        API.get("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(() => {
            
            setIsAdmin(true);
          })
          .catch(() => {
            
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