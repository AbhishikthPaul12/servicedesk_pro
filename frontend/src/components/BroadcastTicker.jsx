import React, { useState } from "react";
import { Radio, ChevronRight, Pause, Play, X, ShieldCheck, Zap, Activity, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const defaultTickerItems = [
  {
    icon: "🟢",
    label: "Cloud Ops",
    text: "AWS & Azure infrastructure 100% operational · Global latency 24ms",
    highlight: "Operational"
  },
  {
    icon: "⚡",
    label: "SLA Target",
    text: "Tier-1 response compliance at 95.8% · 0 Critical Breaches today",
    highlight: "95.8% Met"
  },
  {
    icon: "🤖",
    label: "AI Auto-Triage",
    text: "Gemini AI assistant active · 38 tickets classified automatically",
    highlight: "Active v2.4"
  },
  {
    icon: "🛡️",
    label: "SecOps",
    text: "Zero-Day endpoint vulnerability scan complete · All nodes secure",
    highlight: "Secure"
  },
  {
    icon: "📦",
    label: "Hardware Fleet",
    text: "Hardware audit synchronized · 100% inventory assets accounted for",
    highlight: "Audited"
  },
  {
    icon: "🔔",
    label: "Notice",
    text: "Scheduled database maintenance this Sunday 02:00 UTC",
    highlight: "Notice"
  }
];

const BroadcastTicker = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="broadcast-ticker-wrapper"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="broadcast-ticker-inner">
          {}
          <div className="ticker-badge">
            <span className="ticker-pulse-dot" />
            <Radio size={13} className="ticker-radio-icon" />
            <span className="ticker-badge-text">LIVE PULSE</span>
          </div>

          {}
          <div
            className={`ticker-marquee-viewport ${isPaused ? "is-paused" : ""}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {}
            <div className="ticker-marquee-track">
              {defaultTickerItems.map((item, idx) => (
                <div key={`track-1-${idx}`} className="ticker-item">
                  <span className="ticker-item-icon">{item.icon}</span>
                  <span className="ticker-item-label">{item.label}:</span>
                  <span className="ticker-item-text">{item.text}</span>
                  <span className="ticker-item-pill">{item.highlight}</span>
                  <span className="ticker-item-separator">✦</span>
                </div>
              ))}
            </div>
            <div className="ticker-marquee-track" aria-hidden="true">
              {defaultTickerItems.map((item, idx) => (
                <div key={`track-2-${idx}`} className="ticker-item">
                  <span className="ticker-item-icon">{item.icon}</span>
                  <span className="ticker-item-label">{item.label}:</span>
                  <span className="ticker-item-text">{item.text}</span>
                  <span className="ticker-item-pill">{item.highlight}</span>
                  <span className="ticker-item-separator">✦</span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="ticker-actions">
            <button
              className="ticker-btn"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Resume scrolling" : "Pause scrolling"}
              aria-label="Toggle ticker pause"
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
            <button
              className="ticker-btn"
              onClick={() => setIsVisible(false)}
              title="Dismiss ticker"
              aria-label="Dismiss ticker"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BroadcastTicker;
