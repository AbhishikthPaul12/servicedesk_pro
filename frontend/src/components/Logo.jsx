import React from "react";
import { motion } from "framer-motion";

export const LogoIcon = ({ size = 38, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        {}
        <linearGradient id="rd-cmp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a0e1a" />
          <stop offset="50%" stopColor="#101827" />
          <stop offset="100%" stopColor="#0a0e1a" />
        </linearGradient>

        {}
        <linearGradient id="rd-cmp-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.85" />
        </linearGradient>

        {}
        <linearGradient id="rd-cmp-spine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="60%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {}
        <linearGradient id="rd-cmp-loop" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#6366f1" />
          <stop offset="85%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>

        {}
        <linearGradient id="rd-cmp-wing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f2fe" />
          <stop offset="45%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>

        {}
        <filter id="rd-cmp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="rd-cmp-ambient" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="26"
        fill="url(#rd-cmp-bg)"
        stroke="url(#rd-cmp-border)"
        strokeWidth="2.5"
      />

      {}
      <circle cx="50" cy="50" r="26" fill="#2563eb" opacity="0.25" filter="url(#rd-cmp-ambient)" />
      <circle cx="65" cy="65" r="16" fill="#10b981" opacity="0.2" filter="url(#rd-cmp-ambient)" />

      {}
      {}
      <rect x="22" y="22" width="13" height="56" rx="6.5" fill="url(#rd-cmp-spine)" />

      {}
      <path
        d="M 28 28 H 54 C 69 28, 77 35, 77 44 C 77 53, 69 60, 54 60 H 30"
        fill="none"
        stroke="url(#rd-cmp-loop)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {}
      <path
        d="M 45 52 L 69 76"
        fill="none"
        stroke="url(#rd-cmp-wing)"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {}
      <path
        d="M 51 40 Q 51 44 47 44 Q 51 44 51 48 Q 51 44 55 44 Q 51 44 51 40 Z"
        fill="#ffffff"
        filter="url(#rd-cmp-glow)"
      />
      <circle cx="51" cy="44" r="1.5" fill="#ffffff" />
    </svg>
  );
};

const Logo = ({ size = 38, className = "", animate = true }) => {
  return (
    <motion.div
      className={`app-brand-logo ${className}`}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "26%",
        boxShadow: "0 4px 20px rgba(0, 242, 254, 0.18), 0 2px 8px rgba(37, 99, 235, 0.25)",
        cursor: "pointer",
        flexShrink: 0,
      }}
      whileHover={animate ? { scale: 1.06, boxShadow: "0 6px 28px rgba(0, 242, 254, 0.35), 0 2px 12px rgba(37, 99, 235, 0.4)" } : undefined}
      whileTap={animate ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <LogoIcon size={size} />
    </motion.div>
  );
};

export default Logo;
