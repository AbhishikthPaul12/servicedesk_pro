import React, { useEffect, useState } from "react";
import API from "../services/api";

const SystemConfig = () => {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get("/config").then((res) => {
      if (res.data.success) setConfig(res.data.config);
    }).catch((err) => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.patch("/config", {
        businessHours: config.businessHours,
        slaAtRiskThresholdPercent: config.slaAtRiskThresholdPercent,
        notificationSettings: config.notificationSettings
      });
      if (res.data.success) {
        setConfig(res.data.config);
        alert("Configuration saved");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <div className="card">Loading configuration...</div>;

  const bh = config.businessHours || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Configuration</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Business hours, SLA at-risk threshold, and notification settings (System Admin only).
          </p>
        </div>
      </div>

      <form className="card" onSubmit={handleSave} style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 12 }}>Business Hours (UTC)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Start Hour (0–23)</label>
            <input
              type="number"
              className="form-input"
              min={0}
              max={23}
              value={bh.startHour ?? 9}
              onChange={(e) =>
                setConfig({
                  ...config,
                  businessHours: { ...bh, startHour: Number(e.target.value) }
                })
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Hour (1–24)</label>
            <input
              type="number"
              className="form-input"
              min={1}
              max={24}
              value={bh.endHour ?? 17}
              onChange={(e) =>
                setConfig({
                  ...config,
                  businessHours: { ...bh, endHour: Number(e.target.value) }
                })
              }
            />
          </div>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 16 }}>
          Default working days: Monday–Friday. Holidays can be stored as YYYY-MM-DD in the API.
        </p>

        <div className="form-group">
          <label className="form-label">SLA At-Risk Threshold (%)</label>
          <input
            type="number"
            className="form-input"
            min={1}
            max={99}
            value={config.slaAtRiskThresholdPercent ?? 80}
            onChange={(e) =>
              setConfig({ ...config, slaAtRiskThresholdPercent: Number(e.target.value) })
            }
          />
          <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
            Tickets become &quot;at risk&quot; when this percentage of the resolution window has elapsed (default 80%).
          </p>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </form>
    </div>
  );
};

export default SystemConfig;
