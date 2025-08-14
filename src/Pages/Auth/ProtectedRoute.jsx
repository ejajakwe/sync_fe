import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "@/lib/auth";

export default function ProtectedRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}