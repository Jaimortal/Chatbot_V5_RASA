import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem("adminToken");
      const isAuth = localStorage.getItem("adminAuthenticated") === "true";
      
      if (!token || !isAuth) {
        setIsAuthenticated(false);
        return false;
      }

      // Verify token with server
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        // Token invalid, clear storage
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminAuthenticated");
        localStorage.removeItem("googleUser");
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = (token: string) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (token) {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminAuthenticated");
      localStorage.removeItem("googleUser");
      setIsAuthenticated(false);
      window.location.href = "/admin/login";
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
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
