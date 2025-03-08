import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  // Check for authentication with error handling
  const isAuthenticated = (() => {
    try {
      return localStorage.getItem("taskManagerUser") !== null;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  })();

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
