import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../components/Logo";
import AuthMarquee from "../components/AuthMarquee";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-bg-blob auth-blob-1" />
      <div className="auth-bg-blob auth-blob-2" />

      {/* Theme toggle */}
      <motion.div
        style={{ position: "absolute", top: "24px", right: "24px", zIndex: 10 }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun size={18} className="theme-sun" />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon size={18} className="theme-moon" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          style={{ textAlign: "center", marginBottom: "28px" }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <Logo size={58} />
          </div>
          <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            ResolveDesk
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "5px" }}>
            ServiceDesk Pro &middot; Enterprise ITSM Platform
          </p>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="alert-error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "16px" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.22 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input form-input-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@servicedesk.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input form-input-icon form-input-icon-right"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", marginTop: "12px", fontSize: "0.95rem" }}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                <span className="btn-spinner" /> Signing in...
              </span>
            ) : (
              <>Sign In to ResolveDesk <ArrowRight size={16} /></>
            )}
          </motion.button>
        </motion.form>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ fontWeight: 600, color: "var(--primary)" }}>
            Register here
          </Link>
        </p>
      </motion.div>

      {/* Enterprise compliance and feature marquee */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        style={{ zIndex: 5, width: "100%", display: "flex", justifyContent: "center", padding: "0 16px" }}
      >
        <AuthMarquee />
      </motion.div>
    </div>
  );
};

export default Login;
