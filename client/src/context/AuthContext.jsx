import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        // Maps completely to your specified backend architecture path layout: GET /auth/profile
        const response = await api.get("/auth/profile");
        // Accommodates both wrapped data objects and direct record payloads
        setUser(response.data.user || response.data);
      } catch (error) {
        console.error("Session re-verification context dropped:", error);
        Cookies.remove("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  const login = (token, userData) => {
    Cookies.set("token", token, { 
      expires: 1, 
      secure: window.location.protocol === "https:", 
      sameSite: "strict" 
    });
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Fires server tracking event notification layout context: POST /auth/logout
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Server-side session logout drop failed:", err);
    } finally {
      Cookies.remove("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be called within AuthProvider");
  return context;
}