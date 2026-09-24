import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAssets, createAsset, updateAsset, deleteAsset, assignAsset, returnAsset } from "../services/assetService";
import { getAssignableUsers } from "../services/userService";
import { HardDrive, Plus, Search, UserCheck, RotateCcw, Trash2, Edit3, ShieldAlert } from "lucide-react";

const Assets = () => {
  const { isSystemAdmin, isAssetManager } = useAuth();
  const canManage = isSystemAdmin || isAssetManager;

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");

  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("laptop");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState("available");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");

  useEffect(() => {
    fetchAssets();
    if (canManage) fetchUsersList();
  }, [search, statusFilter, typeFilter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await getAssets({ keyword: search, status: statusFilter, type: typeFilter });
      if (res.success) setAssets(res.assets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const res = await getAssignableUsers();
      if (res.success) {
        setUsers(res.users || []);
      } else {
        setUsersError("Unable to load users for asset assignment.");
      }
    } catch (err) {
      console.error(err);
      setUsersError(err.response?.data?.message || "Unable to load users for asset assignment.");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await createAsset({
        assetTag,
        name,
        type,
        brand,
        model,
        serialNumber,
        status,
        purchaseDate: purchaseDate || undefined,
        warrantyExpiry: warrantyExpiry || undefined
      });

      if (res.success) {
        setShowAddModal(false);
        resetForm();
        fetchAssets();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create asset");
    }
  };

  const handleAssignAsset = async () => {
    if (!selectedAsset || !selectedUser) return;
    setAssigning(true);
    try {
      const res = await assignAsset(selectedAsset._id, selectedUser);
      if (res.success) {
        setShowAssignModal(false);
        setSelectedAsset(null);
        setSelectedUser("");
        fetchAssets();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign asset");
    } finally {
      setAssigning(false);
    }
  };

  const handleReturnAsset = async (assetId) => {
    if (!window.confirm("Confirm return of this asset?")) return;
    try {
      const res = await returnAsset(assetId);
      if (res.success) fetchAssets();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to return asset");
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm("Are you sure you want to delete this asset record?")) return;
    try {
      await deleteAsset(assetId);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete asset");
    }
  };

  const resetForm = () => {
    setAssetTag("");
    setName("");
    setBrand("");
    setModel("");
    setSerialNumber("");
    setStatus("available");
    setPurchaseDate("");
    setWarrantyExpiry("");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hardware & Software Asset Management</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Lifecycle tracking, assignment, warranties, and hardware registry.</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add New Asset
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by Asset Tag, Name, Brand, Serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="procurement">Procurement</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>

        <select className="form-select" style={{ width: "auto" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Asset Types</option>
          <option value="laptop">Laptop</option>
          <option value="desktop">Desktop</option>
          <option value="monitor">Monitor</option>
          <option value="mobile">Mobile / Tablet</option>
          <option value="software">Software License</option>
          <option value="accessory">Accessory</option>
        </select>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Brand / Model</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Assigned User</th>
                <th>Warranty Expiry</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: "center" }}>Loading assets...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: "center", color: "#64748b" }}>No assets found in inventory.</td></tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset._id}>
                    <td style={{ fontWeight: 600 }}>{asset.assetTag}</td>
                    <td>{asset.name}</td>
                    <td style={{ textTransform: "capitalize" }}>{asset.type}</td>
                    <td>{asset.brand} {asset.model}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{asset.serialNumber || "N/A"}</td>
                    <td>
                      <span className={`badge ${asset.status === "assigned" ? "badge-assigned" : asset.status === "available" ? "badge-resolved" : "badge-critical"}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>{asset.assignedTo ? asset.assignedTo.name : <em style={{ color: "#94a3b8" }}>Unassigned</em>}</td>
                    <td>{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "N/A"}</td>
                    {canManage && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {asset.status === "available" && (
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setSelectedUser("");
                                setShowAssignModal(true);
                                fetchUsersList();
                              }}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Assign User"
                            >
                              <UserCheck size={14} /> Assign
                            </button>
                          )}

                          {asset.status === "assigned" && (
                            <button
                              onClick={() => handleReturnAsset(asset._id)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              title="Return Asset"
                            >
                              <RotateCcw size={14} /> Return
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteAsset(asset._id)}
                            className="btn btn-danger"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create New Asset Record</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateAsset}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Asset Tag / ID</label>
                  <input type="text" className="form-input" placeholder="e.g. AST-1002" value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input type="text" className="form-input" placeholder="e.g. MacBook Pro 16" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Asset Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="laptop">Laptop</option>
                    <option value="desktop">Desktop</option>
                    <option value="monitor">Monitor</option>
                    <option value="mobile">Mobile / Tablet</option>
                    <option value="software">Software License</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lifecycle Status</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="available">Available (Procurement)</option>
                    <option value="maintenance">Under Repair / Maintenance</option>
                    <option value="retired">Retired / Replacement</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input type="text" className="form-input" placeholder="Apple / Dell / Lenovo" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input type="text" className="form-input" placeholder="M3 Max 32GB" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input type="text" className="form-input" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warranty Expiry Date</label>
                  <input type="date" className="form-input" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showAssignModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Assign Asset: {selectedAsset?.name} ({selectedAsset?.assetTag})</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAsset(null);
                  setSelectedUser("");
                }}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Select User to Assign</label>
              {usersLoading ? (
                <div style={{ padding: "12px", color: "#64748b", fontStyle: "italic" }}>
                  Loading eligible users...
                </div>
              ) : usersError ? (
                <div style={{ padding: "12px", color: "#ef4444", fontSize: "0.9rem" }}>
                  <span>{usersError}</span>
                  <button
                    type="button"
                    onClick={fetchUsersList}
                    className="btn btn-secondary"
                    style={{ marginLeft: "10px", padding: "2px 8px", fontSize: "0.8rem" }}
                  >
                    Retry
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: "12px", color: "#64748b", fontSize: "0.9rem" }}>
                  No eligible users found.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  disabled={assigning}
                >
                  <option value="">Select Employee / User...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email} - {u.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAsset(null);
                  setSelectedUser("");
                }}
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignAsset}
                className="btn btn-primary"
                disabled={assigning || !selectedUser || usersLoading || users.length === 0}
              >
                {assigning ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
