import React, { useEffect, useState } from "react";
import API from "../services/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/categories", { params: { includeInactive: true } });
      if (res.data.success) setCategories(res.data.categories || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/categories", { name: displayName, displayName, description });
      setDisplayName("");
      setDescription("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create category");
    }
  };

  const archive = async (cat) => {
    try {
      await API.delete(`/categories/${cat._id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to archive");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ticket Categories</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Manage ticket category catalog. Archiving preserves existing ticket references.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12 }}>
          <input className="form-input" placeholder="Display name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <input className="form-input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Key</th><th>Display Name</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td><code>{c.name}</code></td>
                  <td>{c.displayName}</td>
                  <td>{c.isActive !== false ? "Active" : "Archived"}</td>
                  <td>
                    {c.isActive !== false && (
                      <button className="btn btn-secondary" style={{ fontSize: "0.8rem" }} onClick={() => archive(c)}>
                        Archive
                      </button>
                    )}
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

export default Categories;
