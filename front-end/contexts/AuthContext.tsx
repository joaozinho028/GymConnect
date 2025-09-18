"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  login: (token: string, user?: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Checar token salvo no localStorage quando o app inicia
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Redirecionar conforme estado
  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
    if (isAuthenticated && pathname === "/login") {
      router.push("/inicio");
    }
  }, [isAuthenticated, pathname, router]);

  const login = (jwtToken: string, userObj?: any) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
    setIsAuthenticated(true);
    if (userObj) {
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
    }
    router.push("/inicio");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
};
