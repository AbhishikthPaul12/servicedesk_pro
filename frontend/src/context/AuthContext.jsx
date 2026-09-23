import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getMe } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await getMe();
          setUser(res.user);
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await registerUser(userData);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  const role = user?.role || "";
  const isSystemAdmin = role === "system_admin" || role === "admin";
  const isITManager = role === "it_manager" || role === "manager";
  const isTechnician = role === "technician";
  const isEmployee = role === "employee";
  const isAssetManager = role === "asset_manager";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isSystemAdmin,
        isITManager,
        isTechnician,
        isEmployee,
        isAssetManager,
        role
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
