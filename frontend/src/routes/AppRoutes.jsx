import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Tickets from "../pages/Tickets";
import TicketDetails from "../pages/TicketDetails";
import CreateTicket from "../pages/CreateTicket";
import Assets from "../pages/Assets";
import Reports from "../pages/Reports";
import Users from "../pages/Users";
import KnowledgeBase from "../pages/KnowledgeBase";
import KnowledgeArticle from "../pages/KnowledgeArticle";
import SLAManagement from "../pages/SLAManagement";
import VendorManagement from "../pages/VendorManagement";
import Departments from "../pages/Departments";
import Categories from "../pages/Categories";
import SystemConfig from "../pages/SystemConfig";
import AuditLogs from "../pages/AuditLogs";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader-container">
        <div className="spinner" />
        <p>Loading ResolveDesk...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const userRole = user.role;
    const hasRole = allowedRoles.some((r) => {
      if (r === "system_admin" && (userRole === "admin" || userRole === "system_admin")) return true;
      if (r === "it_manager" && (userRole === "manager" || userRole === "it_manager")) return true;
      return userRole === r;
    });

    if (!hasRole) return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute>
            <CreateTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assets"
        element={
          <ProtectedRoute allowedRoles={["system_admin", "it_manager", "asset_manager", "technician"]}>
            <Assets />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={["system_admin", "it_manager", "asset_manager"]}>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["system_admin", "it_manager"]}>
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/knowledge"
        element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge/:id"
        element={
          <ProtectedRoute>
            <KnowledgeArticle />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sla"
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <SLAManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendors"
        element={
          <ProtectedRoute allowedRoles={["system_admin", "asset_manager"]}>
            <VendorManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <Departments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <Categories />
          </ProtectedRoute>
        }
      />

      <Route
        path="/config"
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <SystemConfig />
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit"
        element={
          <ProtectedRoute allowedRoles={["system_admin"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
