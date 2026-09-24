import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getArticles, createArticle } from "../services/knowledgeService";
import { BookOpen, Search, Plus, ThumbsUp, Eye, Sparkles } from "lucide-react";

const KnowledgeBase = () => {
  const { isEmployee } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [artCategory, setArtCategory] = useState("software");
  const [visibility, setVisibility] = useState("all");
  const [status, setStatus] = useState("published");

  useEffect(() => {
    fetchArticles();
  }, [search, category]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await getArticles({ keyword: search, category });
      if (res.success) setArticles(res.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      const res = await createArticle({
        title,
        summary,
        content,
        category: artCategory,
        visibility,
        status
      });

      if (res.success) {
        setShowCreateModal(false);
        setTitle("");
        setContent("");
        setSummary("");
        fetchArticles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create article");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Base & Solutions</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Self-service guides, troubleshooting articles, and internal documentation.</p>
        </div>
        {!isEmployee && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> New Article
          </button>
        )}
      </div>

      <div className="filters-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            placeholder="Search knowledge base articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="network">Network</option>
          <option value="access">Access</option>
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No knowledge articles found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {articles.map((art) => (
            <div key={art._id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span className="badge badge-role" style={{ textTransform: "capitalize" }}>{art.category}</span>
                  <span className="badge badge-low">{art.visibility}</span>
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                  <Link to={`/knowledge/${art._id}`}>{art.title}</Link>
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "16px" }}>
                  {art.summary || (art.content ? art.content.substring(0, 120) + "..." : "")}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "0.8rem", color: "#94a3b8" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Eye size={14} /> {art.viewCount} views</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ThumbsUp size={14} /> {art.helpfulCount} helpful</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Knowledge Article</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateArticle}>
              <div className="form-group">
                <label className="form-label">Article Title</label>
                <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={artCategory} onChange={(e) => setArtCategory(e.target.value)}>
                    <option value="hardware">Hardware</option>
                    <option value="software">Software</option>
                    <option value="network">Network</option>
                    <option value="access">Access</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="all">All (Public/Employees)</option>
                    <option value="technician">Technicians Only</option>
                    <option value="manager">IT Managers Only</option>
                    <option value="admin">System Admin Only</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Summary / Short Overview</label>
                <input type="text" className="form-input" value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Full Article Content</label>
                <textarea className="form-textarea" rows="6" value={content} onChange={(e) => setContent(e.target.value)} required></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
