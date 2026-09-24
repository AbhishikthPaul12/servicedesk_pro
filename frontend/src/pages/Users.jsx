import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUsers, updateUser, createUser } from "../services/userService";
import API from "../services/api";
import { getRoleLabel } from "../utils/roles";
import { Search, CheckCircle, XCircle, UserPlus } from "lucide-react";

const Users = () => {
  const { isSystemAdmin, isITManager } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("employee");
  const [editDepartment, setEditDepartment] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: ""
  });

  const roleNeedsDepartment = (role) =>
    ["employee", "technician", "it_manager"].includes(role);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, page]);

  useEffect(() => {
    if (isSystemAdmin) {
      API.get("/departments")
        .then((res) => {
          if (res.data.success) {
            setDepartments(
              (res.data.departments || []).filter((d) => d.isActive !== false)
            );
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isSystemAdmin]);

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
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const openManage = (u) => {
    setSelectedUser(u);
    setNewRole(u.role === "admin" ? "system_admin" : u.role === "manager" ? "it_manager" : u.role);
    setIsActive(u.isActive);
    setEditDepartment(u.department?._id || u.department || "");
  };

  const handleSaveUser = async () => {
    if (!selectedUser || !isSystemAdmin) return;
    if (roleNeedsDepartment(newRole) && !editDepartment) {
      alert("Department is required for Employee, Technician, and IT Manager roles.");
      return;
    }
    try {
      const updates = {
        isActive,
        role: newRole,
        department: editDepartment || null
      };
      const res = await updateUser(selectedUser._id, updates);
      if (res.success) {
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (roleNeedsDepartment(createForm.role) && !createForm.department) {
      alert("Department is required for Employee, Technician, and IT Manager roles.");
      return;
    }
    try {
      const payload = {
        ...createForm,
        department: createForm.department || undefined
      };
      const res = await createUser(payload);
      if (res.success) {
        setShowCreate(false);
        setCreateForm({
          name: "",
          email: "",
          password: "",
          role: "employee",
          department: ""
        });
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isITManager && !isSystemAdmin ? "Team Directory" : "User & Role Administration"}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            {isITManager && !isSystemAdmin
              ? "Read-only view of technicians and staff in your department."
              : "Manage platform access, assigned roles, and department affiliations."}
          </p>
        </div>
        {isSystemAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={16} /> Create User
          </button>
        )}
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
                {isSystemAdmin && <th>Action</th>}
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
                    <td><span className="badge badge-role">{getRoleLabel(u.role)}</span></td>
                    <td>{u.department ? u.department.name : "—"}</td>
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
                    {isSystemAdmin && (
                      <td>
                        <button
                          onClick={() => openManage(u)}
                          className="btn btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        >
                          Manage
                        </button>
                      </td>
                    )}
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

      {selectedUser && isSystemAdmin && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Manage User: {selectedUser.name}</h3>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>

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

            <div className="form-group">
              <label className="form-label">
                Department {roleNeedsDepartment(newRole) ? "*" : "(optional)"}
              </label>
              <select
                className="form-select"
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                required={roleNeedsDepartment(newRole)}
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>

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

      {showCreate && isSystemAdmin && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create User</h3>
              <button className="close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" required minLength={2} value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password (min 8)</label>
                <input type="password" className="form-input" required minLength={8} value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="technician">Technician</option>
                  <option value="it_manager">IT Manager</option>
                  <option value="asset_manager">Asset Manager</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Department {roleNeedsDepartment(createForm.role) ? "*" : "(optional)"}
                </label>
                <select
                  className="form-select"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  required={roleNeedsDepartment(createForm.role)}
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginTop: 6 }}>
                    No active departments found. Create one under Departments first.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
