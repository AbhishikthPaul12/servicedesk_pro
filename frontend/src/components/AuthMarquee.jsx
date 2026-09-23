import React from "react";
import { Sparkles, Shield, Zap, Lock, BarChart3, Bot, CheckCircle } from "lucide-react";

const authFeatures = [
  { icon: <Sparkles size={13} />, text: "Enterprise ITIL v4 Aligned" },
  { icon: <Shield size={13} />, text: "SOC 2 Type II & ISO 27001 Certified" },
  { icon: <Zap size={13} />, text: "Sub-15m Priority SLA Response Guarantee" },
  { icon: <Bot size={13} />, text: "AI-Powered Smart Auto-Triage & Solution Recommendations" },
  { icon: <Lock size={13} />, text: "End-to-End Encrypted Audit & Role-Based Access" },
  { icon: <BarChart3 size={13} />, text: "Real-Time IT Telemetry & SLA Tracking Engine" },
  { icon: <CheckCircle size={13} />, text: "Automated Hardware Lifecycle & Vendor Management" }
];

const AuthMarquee = () => {
  return (
    <div className="auth-marquee-container">
      <div className="auth-marquee-content">
        <div className="auth-marquee-track">
          {authFeatures.map((feat, i) => (
            <div key={`auth-1-${i}`} className="auth-marquee-item">
              <span className="auth-marquee-icon">{feat.icon}</span>
              <span className="auth-marquee-text">{feat.text}</span>
              <span className="auth-marquee-dot">•</span>
            </div>
          ))}
        </div>
        <div className="auth-marquee-track" aria-hidden="true">
          {authFeatures.map((feat, i) => (
            <div key={`auth-2-${i}`} className="auth-marquee-item">
              <span className="auth-marquee-icon">{feat.icon}</span>
              <span className="auth-marquee-text">{feat.text}</span>
              <span className="auth-marquee-dot">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthMarquee;
