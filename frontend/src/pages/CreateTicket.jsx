import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../services/ticketService";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("software");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createTicket({
        title,
        description,
        category,
        priority
      });

      if (res.success) {
        navigate(`/tickets/${res.ticket._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div className="page-header">
        <h1 className="page-title">Submit New Ticket</h1>
      </div>

      <div className="card">
        {error && (
          <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger-border)", padding: "12px 14px", borderRadius: "var(--radius-md)", marginBottom: "20px", fontSize: "0.88rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ticket Subject / Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength="5"
              placeholder="Brief summary of the issue (e.g. Cannot connect to VPN)"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Service Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network</option>
                <option value="access">Access & Security</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency / Priority</label>
              <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Problem Description</label>
            <textarea
              className="form-textarea"
              rows="6"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength="10"
              placeholder="Provide error messages, steps to reproduce, or affected system details..."
            ></textarea>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Submitting Ticket..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
