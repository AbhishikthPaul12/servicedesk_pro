import React, { useEffect, useState } from "react";
import API from "../services/api";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/departments", { params: { includeInactive: true } });
      if (res.data.success) setDepartments(res.data.departments || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/departments", { name, description });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create department");
    }
  };

  const toggleActive = async (dept) => {
    try {
      await API.patch(`/departments/${dept._id}`, { isActive: !dept.isActive });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Create and manage organizational departments.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12 }}>
          <input className="form-input" placeholder="Department name" required value={name} onChange={(e) => setName(e.target.value)} />
          <input className="form-input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.description || "—"}</td>
                  <td>{d.isActive !== false ? "Active" : "Inactive"}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => toggleActive(d)}>
                      {d.isActive !== false ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Departments;
