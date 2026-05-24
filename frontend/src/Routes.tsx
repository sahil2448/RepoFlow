import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Layout from "./Layout";
import { useAuth } from "./authContext";

const ProjectRoutes: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");
    const isAuthPage = ["/login", "/signup"].includes(window.location.pathname);

    if (userIdFromStorage && !isAuthPage) {
      // Only set if not already set — prevents infinite re-render loop
      if (!currentUser) {
        setCurrentUser({ userId: userIdFromStorage });
      }
    } else if (!userIdFromStorage && !isAuthPage) {
      navigate("/login");
    } else if (userIdFromStorage && isAuthPage) {
      navigate("/");
    }
  }, [currentUser, navigate, setCurrentUser]);

  const element = useRoutes([
    // ── Auth routes (no navbar, no dot-grid) ──
    { path: "/login",  element: <Login /> },
    { path: "/signup", element: <Signup /> },

    // ── App routes (shared Layout with Navbar) ──
    {
      element: <Layout />,
      children: [
        { path: "/",        element: <Dashboard /> },
        { path: "/profile", element: <Profile /> },
        // add more protected routes here
      ],
    },
  ]);

  return element;
};

export default ProjectRoutes;