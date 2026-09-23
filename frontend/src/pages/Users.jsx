import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers, updateUser } from "../services/userService";
import { Users as UsersIcon, Search, Shield, CheckCircle, XCircle } from "lucide-react";

const Users = () => {
  const { isSystemAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Edit user role modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("employee");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ keyword: search, role: roleFilter, page, limit: 10 });
      if (res.success) {
        setUsers(res.users || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      const updates = { isActive };
      if (isSystemAdmin) updates.role = newRole;

      const res = await updateUser(selectedUser._id, updates);
      if (res.success) {
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User & Role Administration</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Manage platform access, assigned roles, and department affiliations.</p>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="form-select" style={{ width: "auto" }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="system_admin">System Admin</option>
          <option value="it_manager">IT Manager</option>
          <option value="technician">Technician</option>
          <option value="employee">Employee</option>
          <option value="asset_manager">Asset Manager</option>
        </select>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: "center" }}>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>No user accounts found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-role">{u.role}</span></td>
                    <td>{u.department ? u.department.name : "General"}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-low" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-critical" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => { setSelectedUser(u); setNewRole(u.role); setIsActive(u.isActive); }}
                        className="btn btn-secondary"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                      >
                        Manage Role
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {/* MANAGE USER MODAL */}
      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Manage User: {selectedUser.name}</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            {isSystemAdmin && (
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="technician">Technician</option>
                  <option value="it_manager">IT Manager</option>
                  <option value="asset_manager">Asset Manager</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-select" value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                <option value="true">Active Account</option>
                <option value="false">Deactivated Account</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
              <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Cancel</button>
              <button onClick={handleSaveUser} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
