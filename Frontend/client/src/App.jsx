import { useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Image from "./components/image";
import Info from "./components/info";
import Navbar from "./components/navbar";
import Status from "./components/status";
import Footer from "./components/footer";

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <>
      <Navbar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      {isAdmin ? (
        <AdminDashboard />
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