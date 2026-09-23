import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArticleById, markHelpful, markNotHelpful } from "../services/knowledgeService";
import { ThumbsUp, ThumbsDown, ArrowLeft, Eye, Calendar, User } from "lucide-react";

const KnowledgeArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const res = await getArticleById(id);
      if (res.success) setArticle(res.article);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async () => {
    try {
      const res = await markHelpful(id);
      if (res.success) setArticle(res.article);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotHelpful = async () => {
    try {
      const res = await markNotHelpful(id);
      if (res.success) setArticle(res.article);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Loading article...</div>;
  if (!article) return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Article not found or access denied.</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: "16px" }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <span className="badge badge-role" style={{ textTransform: "capitalize" }}>{article.category}</span>
          <span className="badge badge-low">{article.visibility}</span>
        </div>

        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "12px", color: "#0f172a" }}>{article.title}</h1>

        <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "#64748b", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "20px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><User size={14} /> {article.createdBy?.name || "Support Team"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {new Date(article.createdAt).toLocaleDateString()}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Eye size={14} /> {article.viewCount} views</span>
        </div>

        {article.summary && (
          <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", marginBottom: "20px", fontSize: "0.95rem", fontStyle: "italic", borderLeft: "3px solid #2563eb" }}>
            {article.summary}
          </div>
        )}

        <div style={{ lineHeight: 1.7, color: "#334155", whiteSpace: "pre-wrap", marginBottom: "32px", fontSize: "1rem" }}>
          {article.content}
        </div>

        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#475569" }}>Was this article helpful?</span>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleHelpful} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              <ThumbsUp size={16} color="#16a34a" /> Yes ({article.helpfulCount})
            </button>
            <button onClick={handleNotHelpful} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              <ThumbsDown size={16} color="#dc2626" /> No ({article.notHelpfulCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticle;
