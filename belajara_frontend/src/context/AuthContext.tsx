"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (username: string, password: string) => Promise<any>;
  googleLogin: (
    email: string,
    firstName: string,
    lastName: string,
    googleId?: string,
    role?: string,
    credential?: string
  ) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const u = await api.auth.me();
      setUser(u);
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
      }
      return u;
    } catch (err) {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("isLoggedIn");
      }
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        const loggedInHint = localStorage.getItem("isLoggedIn");
        if (!loggedInHint) {
          setUser(null);
          setLoading(false);
          return;
        }
      }
      await fetchUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (typeof window !== "undefined" && localStorage.getItem("isLoggedIn") === "true") {
          fetchUser();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    if (res.access) {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", res.access);
      }
    }
    const freshUser = await fetchUser();
    return { ...res, user: freshUser };
  }, []);

  const googleLogin = React.useCallback(async (
    email: string,
    firstName: string,
    lastName: string,
    googleId: string = "",
    role?: string,
    credential?: string
  ) => {
    console.log("DEBUG: Initiating googleLogin for:", email);
    try {
      const res = await api.auth.googleLogin(email, firstName, lastName, googleId, role, credential);
      console.log("DEBUG: googleLogin API success:", res);
      
      if (res.access) {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", res.access);
        }
      }
      
      const freshUser = await fetchUser();
      console.log("DEBUG: fetchUser after googleLogin:", freshUser);
      return { ...res, user: freshUser };
    } catch (err: any) {
      console.error("DEBUG: googleLogin API failed:", err);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error("Failed call to backend logout endpoint:", e);
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("accessToken");
    }
    router.push("/login");
  }, [router]);

  const refreshUser = React.useCallback(async () => {
    return await fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
