import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, ShieldCheck, X, Save } from "lucide-react";
import { getSLAs, createSLA, updateSLA, deleteSLA } from "../services/slaService";
import { useAuth } from "../context/AuthContext";

const PRIORITIES = ["low", "medium", "high", "critical"];

const emptyForm = { name: "", priority: "medium", responseTime: 60, resolutionTime: 480, isActive: true };

const SLAManagement = () => {
  const { isSystemAdmin } = useAuth();
  const [slas, setSlas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchSLAs(); }, []);

  const fetchSLAs = async () => {
    setLoading(true);
    try {
      const res = await getSLAs();
      if (res.success) setSlas(res.data);
    } catch (e) {
      setError("Failed to load SLAs");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setError(""); setShowModal(true); };
  const openEdit = (sla) => { setEditTarget(sla); setForm({ name: sla.name, priority: sla.priority, responseTime: sla.responseTime, resolutionTime: sla.resolutionTime, isActive: sla.isActive }); setError(""); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTarget(null); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await updateSLA(editTarget._id, form);
      } else {
        await createSLA(form);
      }
      await fetchSLAs();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save SLA");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this SLA? Tickets using it will retain their existing SLA deadline.")) return;
    try {
      await deleteSLA(id);
      setSlas((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const priorityColor = (p) => ({ low: "var(--success)", medium: "var(--warning)", high: "var(--danger)", critical: "#7c3aed" }[p] || "var(--primary)");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">SLA Management</h1>
          <p className="page-subtitle">Configure response & resolution time policies per priority level</p>
        </div>
        {isSystemAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> New SLA Policy
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Loading SLA policies...
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Policy Name</th>
                  <th>Priority</th>
                  <th>Response Time</th>
                  <th>Resolution Time</th>
                  <th>Status</th>
                  {isSystemAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {slas.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>No SLA policies configured yet.</td></tr>
                ) : slas.map((sla) => (
                  <motion.tr key={sla._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShieldCheck size={16} style={{ color: priorityColor(sla.priority) }} />
                        {sla.name}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${sla.priority}`}>{sla.priority}</span>
                    </td>
                    <td>
                      {sla.responseTime >= 60
                        ? `${Math.round(sla.responseTime / 60)}h ${sla.responseTime % 60 > 0 ? `${sla.responseTime % 60}m` : ""}`
                        : `${sla.responseTime}m`}
                    </td>
                    <td>
                      {sla.resolutionTime >= 60
                        ? `${Math.round(sla.resolutionTime / 60)}h ${sla.resolutionTime % 60 > 0 ? `${sla.resolutionTime % 60}m` : ""}`
                        : `${sla.resolutionTime}m`}
                    </td>
                    <td>
                      <span className={`badge ${sla.isActive ? "badge-low" : "badge-closed"}`}>
                        {sla.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {isSystemAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-secondary" style={{ padding: "5px 10px" }} onClick={() => openEdit(sla)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn" style={{ padding: "5px 10px", background: "var(--danger-light)", color: "var(--danger)" }} onClick={() => handleDelete(sla._id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Edit SLA Policy" : "Create SLA Policy"}</h2>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Policy Name *</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Critical SLA" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority Level *</label>
                  <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} disabled={!!editTarget}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                  {editTarget && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>Priority cannot be changed after creation.</p>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Response Time (minutes) *</label>
                    <input type="number" className="form-control" min={1} value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Resolution Time (minutes) *</label>
                    <input type="number" className="form-control" min={1} value={form.resolutionTime} onChange={(e) => setForm({ ...form, resolutionTime: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    <span className="form-label" style={{ margin: 0 }}>Policy is Active</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : <><Save size={15} /> {editTarget ? "Update SLA" : "Create SLA"}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SLAManagement;
