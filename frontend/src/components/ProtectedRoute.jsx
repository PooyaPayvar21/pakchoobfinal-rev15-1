import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ requiredRole, children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const normalized = String(requiredRole).toLowerCase();
    const role = String(userRole || "").toLowerCase();
    const roleMap = {
      management: ["management", "manager", "ceo", "superadmin"],
    };
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.map((r) => String(r).toLowerCase())
      : roleMap[normalized] || [normalized];
    if (!allowed.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
