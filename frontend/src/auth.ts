import { createContext, useContext } from "react";

export type User = { userId: string } | null;

export type AuthContextType = {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
