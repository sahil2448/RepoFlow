import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Layout from "./Layout";
import { useAuth } from "./authContext";
import CreateRepo from "./components/repo/CreateRepo";
import RepositoryDetails from "./components/repo/RepoDetails";

const ProjectRoutes: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");
    const isAuthPage = ["/login", "/signup"].includes(window.location.pathname);

    if (userIdFromStorage && !isAuthPage) {
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
    { path: "/login",  element: <Login /> },
    { path: "/signup", element: <Signup /> },
    {
      element: <Layout />,
      children: [
        { path: "/",             element: <Dashboard /> },
        { path: "/profile/:id",  element: <Profile /> },  // ← updated
        { path: "/repo/create",  element: <CreateRepo /> },
        { path: "/repo/:id",     element: <RepositoryDetails /> },
      ],
    },
  ]);

  return element;
};

export default ProjectRoutes;