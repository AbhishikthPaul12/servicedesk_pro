import React, { useEffect, useState } from "react";
import API from "../services/api";
import { getRoleLabel } from "../utils/roles";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await API.get("/audit", {
          params: { page, limit: 25, action: action || undefined, entity: entity || undefined }
        });
        if (res.data.success) {
          setLogs(res.data.logs || []);
          setPages(res.data.pages || 1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, action, entity]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            System-wide audit trail for tickets, users, assets, and configuration changes.
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <input
          className="form-input"
          placeholder="Filter by action (e.g. assigned, escalated)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        />
        <select className="form-select" style={{ width: "auto" }} value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
          <option value="">All entities</option>
          <option value="ticket">Ticket</option>
          <option value="user">User</option>
          <option value="asset">Asset</option>
          <option value="department">Department</option>
          <option value="category">Category</option>
          <option value="system_config">System Config</option>
        </select>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center" }}>No audit entries</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.isSystemAction ? "SYSTEM" : (log.user?.name || "—")}</td>
                    <td>{log.actorRole === "SYSTEM" ? "SYSTEM" : getRoleLabel(log.actorRole || log.user?.role)}</td>
                    <td><code>{log.action}</code></td>
                    <td>{log.entity || "ticket"}</td>
                    <td style={{ maxWidth: 320 }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
