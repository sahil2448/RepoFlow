import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Layout from "./Layout";
import { useAuth } from "./auth";
import CreateRepo from "./components/repo/CreateRepo";
import RepositoryDetails from "./components/repo/RepoDetails";
import ReviewRoom from "./components/review/ReviewRoom";


const ProjectRoutes: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   const userIdFromStorage = localStorage.getItem("userId");
  //   const isAuthPage = ["/login", "/signup"].includes(window.location.pathname);

  //   if (userIdFromStorage && !isAuthPage) {
  //     if (!currentUser) {
  //       setCurrentUser({ userId: userIdFromStorage });
  //     }
  //   } else if (!userIdFromStorage && !isAuthPage) {
  //     navigate("/login");
  //   } else if (userIdFromStorage && isAuthPage) {
  //     navigate("/");
  //   }
  // }, [currentUser, navigate, setCurrentUser]);

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem("userId");
    const path = window.location.pathname;

    // ✅ public routes — no login required
    const isPublicPage = ["/login", "/signup"].includes(path) || path.startsWith("/review/");

    if (userIdFromStorage && !isPublicPage) {
        if (!currentUser) setCurrentUser({ userId: userIdFromStorage });
    } else if (!userIdFromStorage && !isPublicPage) {
        navigate("/login");
    } else if (userIdFromStorage && ["/login", "/signup"].includes(path)) {
        navigate("/");
    }
}, [currentUser, navigate, setCurrentUser]);

  const element = useRoutes([
    { path: "/login",  element: <Login /> },
    { path: "/signup", element: <Signup /> },
    // Add alongside login/signup — NOT inside Layout, full screen video UI
{ path: "/review/:roomId", element: <ReviewRoom /> },
    {
      element: <Layout />,
      children: [
        { path: "/",             element: <Dashboard /> },
        { path: "/profile/:id",  element: <Profile /> },  
        { path: "/repo/create",  element: <CreateRepo /> },
        { path: "/repo/:name/:id",     element: <RepositoryDetails /> },
      ],
    },
  ]);

  return element;
};

export default ProjectRoutes;
