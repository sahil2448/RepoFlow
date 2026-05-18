import React, { createContext, useContext, useEffect, useState, type ReactNode} from "react";

type User = {userId:string} | null;
type AuthContextType = {
    currentUser: User;
    setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () =>{ // custom hook to use the auth context
    const context = useContext(AuthContext);
    if(!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}

export const AuthProvider = ({children}:{children:ReactNode})=>{ // {children} is the component that will be wrapped by the provider
    const [currentUser,setCurrentUser] = useState<User>(null); 

    useEffect(()=>{
        const userId = localStorage.getItem("userId");
        if(userId){
            setCurrentUser({userId});
        }
    },[]); 


    return( <AuthContext.Provider value={{currentUser,setCurrentUser}}>
        {children}
        </AuthContext.Provider>
        );
}

