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
  ScrollText,
  Settings,
  FolderTree,
} from "lucide-react";
import Logo from "./Logo";
import { motion } from "framer-motion";
import { getRoleLabel } from "../utils/roles";

const Sidebar = () => {
  const { user, isSystemAdmin, isITManager, isTechnician, isEmployee, isAssetManager, role } = useAuth();

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
    { to: "/tickets/new", icon: <PlusCircle size={19} className="sidebar-item-icon" />, label: "Create Ticket", show: isEmployee || isTechnician || isITManager || isSystemAdmin },
    { to: "/tickets", icon: <Ticket size={19} className="sidebar-item-icon" />, label: isEmployee ? "My Tickets" : isTechnician ? "Assigned Tickets" : "Helpdesk Tickets", show: !isAssetManager },
    { to: "/knowledge", icon: <BookOpen size={19} className="sidebar-item-icon" />, label: "Knowledge Base", show: true },
    { to: "/assets", icon: <HardDrive size={19} className="sidebar-item-icon" />, label: "Asset Management", show: isSystemAdmin || isITManager || isAssetManager || isTechnician },
    { to: "/vendors", icon: <Building2 size={19} className="sidebar-item-icon" />, label: "Vendor Management", show: isSystemAdmin || isAssetManager },
    { to: "/reports", icon: <BarChart3 size={19} className="sidebar-item-icon" />, label: "Reports & Analytics", show: isSystemAdmin || isITManager || isAssetManager },
    { to: "/sla", icon: <ShieldCheck size={19} className="sidebar-item-icon" />, label: "SLA Policies", show: isSystemAdmin },
    { to: "/departments", icon: <FolderTree size={19} className="sidebar-item-icon" />, label: "Departments", show: isSystemAdmin },
    { to: "/categories", icon: <FolderTree size={19} className="sidebar-item-icon" />, label: "Categories", show: isSystemAdmin },
    { to: "/config", icon: <Settings size={19} className="sidebar-item-icon" />, label: "System Config", show: isSystemAdmin },
    { to: "/audit", icon: <ScrollText size={19} className="sidebar-item-icon" />, label: "Audit Logs", show: isSystemAdmin },
    { to: "/users", icon: <Users size={19} className="sidebar-item-icon" />, label: isITManager && !isSystemAdmin ? "Team Directory" : "User Management", show: isSystemAdmin || isITManager },
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
          <div className="sidebar-user-role">{getRoleLabel(role)}</div>
        </div>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
