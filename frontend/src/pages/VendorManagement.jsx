import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Building2, X, Save, Globe, Phone, Mail, User } from "lucide-react";
import { getVendors, createVendor, updateVendor, deleteVendor } from "../services/vendorService";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["hardware", "software", "network", "cloud", "services", "other"];

const emptyForm = {
  name: "", contactPerson: "", email: "", phone: "", website: "",
  category: "other", contractStart: "", contractEnd: "", notes: "", isActive: true
};

const VendorManagement = () => {
  const { isSystemAdmin, role } = useAuth();
  const canEdit = isSystemAdmin || role === "asset_manager";
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => { fetchVendors(); }, [keyword]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await getVendors({ keyword: keyword || undefined });
      if (res.success) setVendors(res.data);
    } catch {
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setError(""); setShowModal(true); };
  const openEdit = (v) => {
    setEditTarget(v);
    setForm({
      name: v.name, contactPerson: v.contactPerson || "", email: v.email || "",
      phone: v.phone || "", website: v.website || "", category: v.category,
      contractStart: v.contractStart ? v.contractStart.slice(0, 10) : "",
      contractEnd: v.contractEnd ? v.contractEnd.slice(0, 10) : "",
      notes: v.notes || "", isActive: v.isActive
    });
    setError("");
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditTarget(null); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.contractStart) delete payload.contractStart;
      if (!payload.contractEnd) delete payload.contractEnd;
      if (editTarget) {
        await updateVendor(editTarget._id, payload);
      } else {
        await createVendor(payload);
      }
      await fetchVendors();
      closeModal();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this vendor? This cannot be undone.")) return;
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const catColor = { hardware: "var(--primary)", software: "var(--info)", network: "var(--warning)", cloud: "#7c3aed", services: "var(--success)", other: "var(--text-muted)" };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-subtitle">Track hardware/software vendors, contracts, and contact information</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Vendor
          </button>
        )}
      </div>

      {}
      <div className="card" style={{ marginBottom: 20, padding: "14px 20px" }}>
        <input
          className="form-control"
          placeholder="Search vendors by name, contact, or email..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ maxWidth: 420 }}
        />
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Loading vendors...
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Contact</th>
                  <th>Contract Period</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>No vendors found. Add your first vendor.</td></tr>
                ) : vendors.map((v) => (
                  <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{v.name}</div>
                          {v.website && (
                            <a href={v.website} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "var(--primary)" }}>
                              <Globe size={11} style={{ marginRight: 3 }} />{v.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600, background: "var(--bg-elevated)", color: catColor[v.category] || "var(--text-muted)", border: "1px solid var(--border-default)", textTransform: "capitalize" }}>
                        {v.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>
                        {v.contactPerson && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><User size={12} />{v.contactPerson}</div>}
                        {v.email && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}><Mail size={12} />{v.email}</div>}
                        {v.phone && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)" }}><Phone size={12} />{v.phone}</div>}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                      {v.contractStart && <div>From: {new Date(v.contractStart).toLocaleDateString()}</div>}
                      {v.contractEnd && (
                        <div style={{ color: new Date(v.contractEnd) < new Date() ? "var(--danger)" : "var(--success)" }}>
                          Until: {new Date(v.contractEnd).toLocaleDateString()}
                        </div>
                      )}
                      {!v.contractStart && !v.contractEnd && <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${v.isActive ? "badge-low" : "badge-closed"}`}>
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-secondary" style={{ padding: "5px 10px" }} onClick={() => openEdit(v)}>
                            <Edit2 size={13} />
                          </button>
                          {isSystemAdmin && (
                            <button className="btn" style={{ padding: "5px 10px", background: "var(--danger-light)", color: "var(--danger)" }} onClick={() => handleDelete(v._id)}>
                              <Trash2 size={13} />
                            </button>
                          )}
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
          <motion.div className="modal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Edit Vendor" : "Add Vendor"}</h2>
              <button className="modal-close" onClick={closeModal}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                <div className="form-group">
                  <label className="form-label">Vendor Name *</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Technologies" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input className="form-control" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vendor@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-control" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://vendor.com" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Contract Start</label>
                    <input type="date" className="form-control" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contract End</label>
                    <input type="date" className="form-control" value={form.contractEnd} onChange={(e) => setForm({ ...form, contractEnd: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about this vendor..." />
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    <span className="form-label" style={{ margin: 0 }}>Vendor is Active</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : <><Save size={15} /> {editTarget ? "Update Vendor" : "Add Vendor"}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default VendorManagement;
