import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { StorageManager } from "@/components/storage/StorageManager";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase auth if available
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage
        const userJson = StorageManager.getItem("taskManagerUser");
        setIsAuthenticated(userJson !== null);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and on login page, redirect to home
  if (isAuthenticated && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
