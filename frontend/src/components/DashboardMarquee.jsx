import React from "react";
import { Activity, Bell, AlertTriangle, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

const liveStreamUpdates = [
  {
    type: "sla",
    icon: <AlertTriangle size={13} style={{ color: "var(--warning)" }} />,
    tag: "SLA ALERT",
    tagClass: "tag-warning",
    msg: "Ticket #1034 (Email Server Outage) is at 80% resolution window — technician assigned."
  },
  {
    type: "ai",
    icon: <ShieldCheck size={13} style={{ color: "var(--primary)" }} />,
    tag: "AI TRIAGE",
    tagClass: "tag-primary",
    msg: "Gemini AI auto-routed 4 network routing requests to Tier-2 Engineering."
  },
  {
    type: "asset",
    icon: <Activity size={13} style={{ color: "var(--info)" }} />,
    tag: "ASSET UPDATE",
    tagClass: "tag-info",
    msg: "Dell Latitude 5450 fleet firmware security update distributed across 18 endpoints."
  },
  {
    type: "resolved",
    icon: <CheckCircle2 size={13} style={{ color: "var(--success)" }} />,
    tag: "RESOLVED",
    tagClass: "tag-success",
    msg: "VPN Gateway Latency incident resolved in 18 minutes (SLA Target: 45 min)."
  },
  {
    type: "vendor",
    icon: <Bell size={13} style={{ color: "var(--accent, #8b5cf6)" }} />,
    tag: "VENDOR CONTRACT",
    tagClass: "tag-purple",
    msg: "Cloudflare Enterprise contract renewal window opens in 30 days."
  }
];

const DashboardMarquee = () => {
  return (
    <div className="dash-marquee-card">
      <div className="dash-marquee-header">
        <span className="dash-marquee-live-dot" />
        <span className="dash-marquee-title">LIVE INCIDENT & OPS STREAM</span>
      </div>

      <div className="dash-marquee-track-container">
        <div className="dash-marquee-track">
          {liveStreamUpdates.map((item, idx) => (
            <div key={`stream-1-${idx}`} className="dash-stream-item">
              <span className="dash-stream-icon">{item.icon}</span>
              <span className={`dash-stream-tag ${item.tagClass}`}>{item.tag}</span>
              <span className="dash-stream-msg">{item.msg}</span>
              <span className="dash-stream-divider">/</span>
            </div>
          ))}
        </div>
        <div className="dash-marquee-track" aria-hidden="true">
          {liveStreamUpdates.map((item, idx) => (
            <div key={`stream-2-${idx}`} className="dash-stream-item">
              <span className="dash-stream-icon">{item.icon}</span>
              <span className={`dash-stream-tag ${item.tagClass}`}>{item.tag}</span>
              <span className="dash-stream-msg">{item.msg}</span>
              <span className="dash-stream-divider">/</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMarquee;
