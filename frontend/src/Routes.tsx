import React, { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import { useAuth } from "./authContext";

const ProjectRoutes = () => {
    const {currentUser,setCurrentUser} = useAuth();
    const navigate = useNavigate();

    useEffect(()=>{
        const userIdFromStorage = localStorage.getItem("userId");
        if(userIdFromStorage && !["/login","/signup"].includes(window.location.pathname)){
            setCurrentUser({ userId: userIdFromStorage });
        } else if(!userIdFromStorage && !["/login","/signup"].includes(window.location.pathname)){
            navigate("/login");
        } else if(userIdFromStorage && ["/login","/signup"].includes(window.location.pathname)){
            navigate("/");
        }
    }, [currentUser, navigate, setCurrentUser]);

    const element = useRoutes([
        {
            path:"/",
            element:<Dashboard/>
        },
        {
            path:"/login",
            element:<Login/>
        },
        {
            path:"/signup",
            element:<Signup/>
        },
        {
            path:"/profile",
            element:<Profile/>
        }
    ])

    return element;
}

export default ProjectRoutes