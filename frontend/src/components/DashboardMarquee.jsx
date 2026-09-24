import React from "react";
import { Activity, Bell, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

const liveStreamUpdates = [
  {
    type: "sla",
    icon: <AlertTriangle size={13} style={{ color: "var(--warning)" }} />,
    tag: "SAMPLE",
    tagClass: "tag-warning",
    msg: "Sample: SLA at-risk and breach alerts appear here when triggered by the monitor."
  },
  {
    type: "ai",
    icon: <ShieldCheck size={13} style={{ color: "var(--primary)" }} />,
    tag: "SAMPLE",
    tagClass: "tag-primary",
    msg: "Sample: AI triage runs on demand from ticket details for authorized staff."
  },
  {
    type: "asset",
    icon: <Activity size={13} style={{ color: "var(--info)" }} />,
    tag: "SAMPLE",
    tagClass: "tag-info",
    msg: "Sample: Live asset and vendor events are managed in Asset & Vendor modules."
  },
  {
    type: "resolved",
    icon: <CheckCircle2 size={13} style={{ color: "var(--success)" }} />,
    tag: "SAMPLE",
    tagClass: "tag-success",
    msg: "Sample: Use the dashboard KPI cards above for real ticket and SLA counts."
  },
  {
    type: "vendor",
    icon: <Bell size={13} style={{ color: "var(--accent, #8b5cf6)" }} />,
    tag: "SAMPLE",
    tagClass: "tag-purple",
    msg: "Sample stream — not live production telemetry."
  }
];

const DashboardMarquee = () => {
  return (
    <div className="dash-marquee-card">
      <div className="dash-marquee-header">
        <span className="dash-marquee-live-dot" />
        <span className="dash-marquee-title">OPS STREAM (DEMO / SAMPLE)</span>
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
