import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import NotificationInit from "./store/NotificationInit.tsx";
import { useTheme } from "./hooks/useTheme.ts";

const Layout: React.FC = () => {
  useTheme();

  return (
    <>
      <style>{`
        .dot-grid {
          background-color: var(--bg-dot);
          background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="dot-grid min-h-screen">
         <NotificationInit /> 
        <Navbar />
        <Outlet /> 
      </div>
    </>
  );
};

export default Layout;
