import { useState, type ReactNode } from "react";
import { AuthContext, type User } from "./auth";

const getStoredUser = (): User => {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem("userId");
    return userId ? { userId } : null;
};

export const AuthProvider = ({children}:{children:ReactNode})=>{ // {children} is the component that will be wrapped by the provider
    const [currentUser,setCurrentUser] = useState<User>(getStoredUser);

    return( <AuthContext.Provider value={{currentUser,setCurrentUser}}>
        {children}
        </AuthContext.Provider>
        );
};

