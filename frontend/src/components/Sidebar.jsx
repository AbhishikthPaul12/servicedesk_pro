import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  HardDrive,
  BarChart3,
  Users,
  BookOpen,
  ShieldCheck,
  Building2,
} from "lucide-react";
import Logo from "./Logo";
import { motion } from "framer-motion";

const Sidebar = () => {
  const { user, isSystemAdmin, isITManager, isTechnician, isEmployee, isAssetManager, role } = useAuth();

  const getRoleDisplayName = (r) => {
    switch (r) {
      case "system_admin":
      case "admin": return "System Admin";
      case "it_manager":
      case "manager": return "IT Manager";
      case "technician": return "Technician";
      case "employee": return "Employee";
      case "asset_manager": return "Asset Manager";
      default: return r;
    }
  };

  const sidebarVariants = {
    hidden: { x: -60, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.06, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { x: -18, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={19} className="sidebar-item-icon" />, label: "Dashboard", show: true },
    { to: "/tickets/new", icon: <PlusCircle size={19} className="sidebar-item-icon" />, label: "Create Ticket", show: isEmployee },
    { to: "/tickets", icon: <Ticket size={19} className="sidebar-item-icon" />, label: isEmployee ? "My Tickets" : isTechnician ? "Assigned Tickets" : "Helpdesk Tickets", show: !isAssetManager },
    { to: "/knowledge", icon: <BookOpen size={19} className="sidebar-item-icon" />, label: "Knowledge Base", show: true },
    { to: "/assets", icon: <HardDrive size={19} className="sidebar-item-icon" />, label: "Asset Management", show: isSystemAdmin || isITManager || isAssetManager },
    { to: "/vendors", icon: <Building2 size={19} className="sidebar-item-icon" />, label: "Vendor Management", show: isSystemAdmin || isITManager || isAssetManager },
    { to: "/reports", icon: <BarChart3 size={19} className="sidebar-item-icon" />, label: "Reports & Analytics", show: isSystemAdmin || isITManager || isAssetManager },
    { to: "/sla", icon: <ShieldCheck size={19} className="sidebar-item-icon" />, label: "SLA Policies", show: isSystemAdmin },
    { to: "/users", icon: <Users size={19} className="sidebar-item-icon" />, label: "User Directory", show: isSystemAdmin || isITManager },
  ];

  return (
    <motion.aside
      className="sidebar"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <motion.div className="sidebar-brand-container" variants={itemVariants}>
        <Logo size={36} />
        <div className="sidebar-brand-text">
          <span className="brand-title">ResolveDesk</span>
          <span className="brand-badge">PRO</span>
        </div>
      </motion.div>

      <nav className="sidebar-menu">
        {navItems.filter((item) => item.show).map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <NavLink
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <motion.div className="sidebar-footer" variants={itemVariants}>
        <div className="sidebar-user-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
          <div className="sidebar-user-role">{getRoleDisplayName(role)}</div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
