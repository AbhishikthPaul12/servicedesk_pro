import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService";
import {
  Bell,
  LogOut,
  Sun,
  Moon,
  CheckCheck,
  Clock,
  ShieldAlert,
  Ticket,
  AlertTriangle,
  MessageSquare,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingId, setMarkingId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.success) {
        const notifs = res.notifications || [];
        setNotifications(notifs);
        // Backend uses isRead, so check isRead
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    if (markingId) return;
    setMarkingId(id);
    try {
      await markNotificationAsRead(id);
      // Optimistically update in-memory state
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "sla_breached": return <AlertTriangle size={14} style={{ color: "var(--danger)" }} />;
      case "ticket_assigned": return <Ticket size={14} style={{ color: "var(--primary)" }} />;
      case "ticket_commented": return <MessageSquare size={14} style={{ color: "var(--info)" }} />;
      case "ticket_status_changed": return <CheckCheck size={14} style={{ color: "var(--success)" }} />;
      default: return <ShieldAlert size={14} style={{ color: "var(--warning)" }} />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "system_admin":
      case "admin": return "System Admin";
      case "it_manager":
      case "manager": return "IT Manager";
      case "technician": return "Technician";
      case "employee": return "Employee";
      case "asset_manager": return "Asset Manager";
      default: return role;
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.header
      className="top-navbar"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="navbar-left">
        <div className="navbar-breadcrumb">
          <span className="breadcrumb-platform">ServiceDesk Pro</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">IT Service Management</span>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Dark / Light Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
          whileHover={{ scale: 1.08, rotate: 10 }}
          whileTap={{ scale: 0.92 }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span
                key="sun"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Sun size={19} className="theme-icon theme-sun" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.2 }}
              >
                <Moon size={19} className="theme-icon theme-moon" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notifications Dropdown */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <motion.button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`navbar-icon-btn ${showNotifications ? "active" : ""}`}
            title="Notifications"
            aria-label="Notifications"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 8 }}
            >
              <Bell size={19} />
            </motion.div>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  className="notification-badge-pulse"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                className="notifications-dropdown"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <div className="dropdown-header">
                  <div className="dropdown-title-group">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="unread-pill">{unreadCount} new</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <motion.button
                      onClick={handleMarkAllRead}
                      className="mark-read-btn"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <CheckCheck size={14} /> Mark all read
                    </motion.button>
                  )}
                </div>

                <div className="dropdown-body">
                  {notifications.length === 0 ? (
                    <div className="notifications-empty">
                      <Bell size={28} className="empty-bell" />
                      <p>All caught up!</p>
                      <span>No notifications in your inbox.</span>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {notifications.slice(0, 7).map((n, i) => (
                        <motion.div
                          key={n._id}
                          className={`notification-item ${!n.isRead ? "unread" : ""}`}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                          layout
                        >
                          <div className="notif-type-icon">{getNotifIcon(n.type)}</div>
                          <div className="notif-content">
                            <p className="notif-title">{n.title || n.message}</p>
                            <span className="notif-time">
                              <Clock size={11} /> {timeAgo(n.createdAt)}
                            </span>
                          </div>
                          {!n.isRead && (
                            <motion.button
                              className="notif-mark-btn"
                              onClick={(e) => handleMarkAsRead(n._id, e)}
                              disabled={markingId === n._id}
                              title="Mark as read"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {markingId === n._id ? (
                                <span className="notif-spinner" />
                              ) : (
                                <CheckCheck size={13} />
                              )}
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="navbar-divider" />

        {/* User Profile Widget */}
        <div className="user-profile-widget">
          <div className="user-profile-details">
            <span className="user-profile-name">{user?.name}</span>
            <span className="user-role-badge">{getRoleBadge(user?.role)}</span>
          </div>

          <motion.button
            onClick={logout}
            className="logout-btn"
            title="Sign Out"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
