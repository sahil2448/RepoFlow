import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";

const Layout: React.FC = () => {
  return (
    <>
      <style>{`
        .dot-grid {
          background-color: #060611;
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="dot-grid min-h-screen">
        <Navbar />
        <Outlet />   {/* ← every child route renders here */}
      </div>
    </>
  );
};

export default Layout;