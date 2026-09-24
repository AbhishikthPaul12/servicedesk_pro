import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTicketById,
  updateTicket,
  assignTicket,
  approveTicket,
  rejectTicket,
  escalateTicket,
  addComment,
  getTicketComments,
  addWorkLog,
  getWorkLogs,
  uploadAttachments,
  analyzeTicket,
  getKBSuggestions
} from "../services/ticketService";
import { getUsers } from "../services/userService";
import { getAllowedStatusOptions, STATUS_LABELS, getRoleLabel } from "../utils/roles";
import { Sparkles, Clock, UserCheck, MessageSquare, Plus, FileText, CheckCircle, AlertCircle, Paperclip, Download, CheckCircle2, RotateCcw, ShieldAlert } from "lucide-react";

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSystemAdmin, isITManager, isTechnician, isEmployee } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [workDesc, setWorkDesc] = useState("");
  const [workTime, setWorkTime] = useState(15);
  const [selectedTech, setSelectedTech] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [resolutionText, setResolutionText] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSuggestions, setKbSuggestions] = useState([]);

  const [attachFiles, setAttachFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [escalationReason, setEscalationReason] = useState("");

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const res = await getTicketById(id);
      if (res.success) {
        setTicket(res.ticket);
        setStatusUpdate(res.ticket.status);
        if (res.ticket.aiAnalysis) setAiAnalysis(res.ticket.aiAnalysis);
      }

      const commentRes = await getTicketComments(id);
      if (commentRes.success) setComments(commentRes.comments || []);

      if (!isEmployee) {
        const workLogRes = await getWorkLogs(id);
        if (workLogRes.success) {
          setWorkLogs(workLogRes.workLogs || []);
          setTotalWorkTime(workLogRes.totalTimeSpentMinutes || 0);
        }
      }

      if (isSystemAdmin || isITManager) {
        const usersRes = await getUsers({ role: "technician" });
        if (usersRes.success) setTechnicians(usersRes.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const updates = { status: statusUpdate };
      if (statusUpdate === "resolved" && resolutionText) {
        updates.resolution = resolutionText;
      }
      const res = await updateTicket(id, updates);
      if (res.success) {
        setTicket(res.ticket);
        alert("Status updated successfully");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    try {
      const res = await assignTicket(id, selectedTech);
      if (res.success) {
        setTicket(res.ticket);
        alert("Technician assigned successfully");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign technician");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await addComment(id, { content: newComment, isInternal });
      if (res.success) {
        setNewComment("");
        setIsInternal(false);
        const commentRes = await getTicketComments(id);
        if (commentRes.success) setComments(commentRes.comments || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleAddWorkLog = async (e) => {
    e.preventDefault();
    if (!workDesc.trim()) return;
    try {
      const res = await addWorkLog(id, { description: workDesc, timeSpent: workTime });
      if (res.success) {
        setWorkDesc("");
        setWorkTime(15);
        const workLogRes = await getWorkLogs(id);
        if (workLogRes.success) {
          setWorkLogs(workLogRes.workLogs || []);
          setTotalWorkTime(workLogRes.totalTimeSpentMinutes || 0);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add work log");
    }
  };

  const handleRunAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await analyzeTicket(id);
      if (res.success) setAiAnalysis(res.analysis);
    } catch (err) {
      alert(err.response?.data?.message || "AI Analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunKBSuggestions = async () => {
    setKbLoading(true);
    try {
      const res = await getKBSuggestions(id);
      if (res.success) setKbSuggestions(res.suggestions || []);
    } catch (err) {
      alert(err.response?.data?.message || "AI KB suggestions failed");
    } finally {
      setKbLoading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (!attachFiles.length) return;
    setUploading(true);
    try {
      const res = await uploadAttachments(id, attachFiles);
      if (res.success) {
        setTicket((prev) => ({ ...prev, attachments: res.attachments }));
        setAttachFiles([]);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!window.confirm("Confirm this ticket is resolved? This will close the ticket.")) return;
    try {
      const res = await updateTicket(id, { status: "closed" });
      if (res.success) setTicket(res.ticket);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to confirm resolution");
    }
  };

  const handleReopenTicket = async () => {
    if (!window.confirm("Reopen this ticket? A technician will need to re-investigate.")) return;
    try {
      const res = await updateTicket(id, { status: "reopened" });
      if (res.success) setTicket(res.ticket);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reopen ticket");
    }
  };

  const handleApprove = async () => {
    try {
      const res = await approveTicket(id, approvalComment);
      if (res.success) {
        setTicket(res.ticket);
        setApprovalComment("");
        alert("Resolution approved — ticket closed");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async () => {
    try {
      const res = await rejectTicket(id, approvalComment, "in_progress");
      if (res.success) {
        setTicket(res.ticket);
        setApprovalComment("");
        alert("Resolution rejected — returned to in progress");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject");
    }
  };

  const handleEscalate = async () => {
    if (!escalationReason.trim()) {
      alert("Escalation reason is required");
      return;
    }
    try {
      const res = await escalateTicket(id, escalationReason);
      if (res.success) {
        setTicket(res.ticket);
        setEscalationReason("");
        alert("Ticket escalated");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to escalate");
    }
  };

  const statusOptions = getAllowedStatusOptions(user?.role, ticket?.status || "open");
  const isInternalNote = (c) => c.type === "internal_note" || c.isInternal === true;

  if (loading) return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Loading ticket details...</div>;
  if (!ticket) return <div className="card" style={{ padding: "40px", textAlign: "center" }}>Ticket not found or unauthorized.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>{ticket.ticketNumber}</span>
          <h1 className="page-title">{ticket.title}</h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className={`badge badge-${ticket.priority}`}>{ticket.priority} priority</span>
          <span className={`badge badge-${ticket.status}`}>
            {STATUS_LABELS[ticket.status] || ticket.status.replace(/_/g, " ")}
          </span>
          <span className={`badge ${ticket.slaStatus === "breached" ? "badge-critical" : "badge-low"}`}>
            SLA: {ticket.slaStatus || "active"}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {}
        <div>
          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>Description</h3>
            <p style={{ whiteSpace: "pre-wrap", color: "#334155" }}>{ticket.description}</p>
            
            {ticket.resolution && (
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f0fdf4", borderLeft: "4px solid #16a34a", borderRadius: "4px" }}>
                <strong style={{ color: "#15803d" }}>Resolution:</strong>
                <p style={{ marginTop: "4px", fontSize: "0.9rem" }}>{ticket.resolution}</p>
              </div>
            )}

            {}
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 700, fontSize: "0.95rem" }}>
                <Paperclip size={16} style={{ color: "var(--primary)" }} /> Attachments ({ticket.attachments?.length || 0})
              </div>
              {ticket.attachments?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {ticket.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${att.url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.82rem", color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
                    >
                      <Download size={13} /> {att.filename}
                    </a>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  style={{ fontSize: "0.82rem" }}
                  onChange={(e) => setAttachFiles(Array.from(e.target.files))}
                />
                <button
                  className="btn btn-secondary"
                  style={{ whiteSpace: "nowrap" }}
                  onClick={handleUploadFiles}
                  disabled={!attachFiles.length || uploading}
                >
                  {uploading ? "Uploading..." : <><Paperclip size={14} /> Upload</>}
                </button>
              </div>
            </div>
          </div>

          {}
          {!isEmployee && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={18} color="#2563eb" /> Gemini AI Diagnostics & KB Assist
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleRunAIAnalysis} className="btn btn-secondary" style={{ fontSize: "0.8rem" }} disabled={aiLoading}>
                    {aiLoading ? "Analyzing..." : "AI Analyze Ticket"}
                  </button>
                  <button onClick={handleRunKBSuggestions} className="btn btn-secondary" style={{ fontSize: "0.8rem" }} disabled={kbLoading}>
                    {kbLoading ? "Finding KB..." : "Get AI KB Articles"}
                  </button>
                </div>
              </div>

              {aiAnalysis && (
                <div className="ai-box">
                  <div className="ai-title"><CheckCircle size={16} /> AI Ticket Classification Result</div>
                  <p><strong>Probable Issue:</strong> {aiAnalysis.probableIssue}</p>
                  <p><strong>Suggested Category:</strong> {aiAnalysis.category} | <strong>Suggested Priority:</strong> {aiAnalysis.priority}</p>
                  <p style={{ fontSize: "0.8rem", color: "#0284c7", marginTop: "4px" }}>Confidence: {(aiAnalysis.confidence * 100).toFixed(0)}%</p>
                </div>
              )}

              {kbSuggestions.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <strong style={{ fontSize: "0.875rem", display: "block", marginBottom: "8px" }}>
                    AI Recommended Resolutions & Solution Guides:
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {kbSuggestions.map((item, idx) => (
                      <div key={idx} className="ai-suggestion-card">
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--primary)" }}>
                          {item.article?.title || "Recommended Resolution"}
                        </div>
                        {item.article?.content && (
                          <div style={{ fontSize: "0.85rem", margin: "6px 0", color: "var(--text-secondary)", whiteSpace: "pre-wrap", maxHeight: "120px", overflowY: "auto" }}>
                            {item.article.content}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          <span>{item.reason}</span>
                          <span className="badge badge-open">Match: {(item.relevanceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {!isEmployee && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={18} /> Work Logs ({totalWorkTime} mins total)
                </h3>
              </div>

              <form onSubmit={handleAddWorkLog} style={{ marginBottom: "16px", backgroundColor: "var(--bg-surface-subtle)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Work description / resolution steps..."
                    value={workDesc}
                    onChange={(e) => setWorkDesc(e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: "100px" }}
                    placeholder="Mins"
                    value={workTime}
                    onChange={(e) => setWorkTime(e.target.value)}
                    min="1"
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                    + Log Time
                  </button>
                </div>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {workLogs.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No work logs recorded yet.</p>
                ) : (
                  workLogs.map((log) => (
                    <div key={log._id} style={{ padding: "12px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--text-primary)" }}>{log.description}</p>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Logged by {log.technician?.name} on {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="badge badge-low">{log.timeSpent} mins</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {}
          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <MessageSquare size={18} /> Ticket Discussion & Comments
            </h3>

            <form onSubmit={handleAddComment} style={{ marginBottom: "20px" }}>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Type your comment or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              ></textarea>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                {!isEmployee && (
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    Internal note (visible to technicians only)
                  </label>
                )}
                <button type="submit" className="btn btn-primary" style={{ marginLeft: "auto" }}>
                  Post Comment
                </button>
              </div>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isInternalNote(c) ? "var(--warning-light)" : "var(--bg-surface-subtle)",
                      border: isInternalNote(c) ? "1px solid var(--warning-border)" : "1px solid var(--border-subtle)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                        {c.user?.name} {isInternalNote(c) && <span style={{ color: "var(--warning)", fontSize: "0.75rem" }}>(Internal Note)</span>}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {}
        <div>
          {}
          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px" }}>Ticket Actions</h3>

            {}
            {isEmployee && (ticket.createdBy?._id === user?.id || ticket.createdBy?._id === user?._id) && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {(ticket.status === "resolved" || ticket.status === "awaiting_manager_approval") && (
                  <button
                    onClick={handleConfirmResolution}
                    className="btn btn-primary"
                    style={{ width: "100%", background: "var(--success)", borderColor: "var(--success)" }}
                  >
                    <CheckCircle2 size={16} /> Confirm Resolution (Close)
                  </button>
                )}
                {(ticket.status === "resolved" || ticket.status === "closed" || ticket.status === "awaiting_manager_approval") && (
                  <button
                    onClick={handleReopenTicket}
                    className="btn btn-secondary"
                    style={{ width: "100%" }}
                  >
                    <RotateCcw size={15} /> Reopen Ticket
                  </button>
                )}
                {ticket.status !== "resolved" && ticket.status !== "closed" && ticket.status !== "awaiting_manager_approval" && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", textAlign: "center" }}>
                    You will be able to confirm or reopen once the ticket is resolved.
                  </p>
                )}
              </div>
            )}

            {}
            {!isEmployee && statusOptions.length > 0 && (
              <>
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select className="form-select" value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                    <option value={ticket.status}>
                      {STATUS_LABELS[ticket.status] || ticket.status} (current)
                    </option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>

                {statusUpdate === "resolved" && (
                  <div className="form-group">
                    <label className="form-label">Resolution Summary</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      placeholder="Explain how the ticket was resolved..."
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                    ></textarea>
                  </div>
                )}

                <button onClick={handleStatusUpdate} className="btn btn-primary" style={{ width: "100%", marginBottom: "16px" }}>
                  Save Status Change
                </button>
              </>
            )}

            {}
            {(isSystemAdmin || isITManager) &&
              (ticket.status === "awaiting_manager_approval" || ticket.status === "resolved") && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", marginBottom: "16px" }}>
                <label className="form-label">Manager Approval</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="Approval / rejection comment..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={handleApprove} className="btn btn-primary" style={{ flex: 1 }}>
                    Approve & Close
                  </button>
                  <button onClick={handleReject} className="btn btn-secondary" style={{ flex: 1 }}>
                    Reject
                  </button>
                </div>
              </div>
            )}

            {}
            {(isSystemAdmin || isITManager) && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px", marginBottom: "16px" }}>
                <label className="form-label">
                  <ShieldAlert size={14} style={{ verticalAlign: "middle" }} /> Escalate Ticket
                </label>
                <input
                  className="form-input"
                  placeholder="Escalation reason (required)"
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                />
                <button onClick={handleEscalate} className="btn btn-secondary" style={{ width: "100%", marginTop: 8 }}>
                  Escalate
                </button>
                {ticket.isEscalated && (
                  <p style={{ fontSize: "0.8rem", color: "var(--danger)", marginTop: 8 }}>
                    Escalated: {ticket.escalationReason}
                  </p>
                )}
              </div>
            )}

            {(isSystemAdmin || isITManager) && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
                <label className="form-label">Assign Technician</label>
                <select className="form-select" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                  <option value="">Select Technician...</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
                <button onClick={handleAssign} className="btn btn-secondary" style={{ width: "100%", marginTop: "8px" }}>
                  Assign Ticket
                </button>
              </div>
            )}
          </div>

          {}
          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>Properties</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.875rem" }}>
              <div><span style={{ color: "#64748b" }}>Requester:</span> <strong>{ticket.createdBy?.name}</strong></div>
              <div><span style={{ color: "#64748b" }}>Assigned Tech:</span> <strong>{ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Department:</span> <strong>{ticket.department ? ticket.department.name : "General"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Created At:</span> <strong>{new Date(ticket.createdAt).toLocaleString()}</strong></div>
              <div><span style={{ color: "#64748b" }}>SLA Due Date:</span> <strong>{ticket.slaDueDate ? new Date(ticket.slaDueDate).toLocaleString() : "N/A"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Response Due:</span> <strong>{ticket.slaResponseDueDate ? new Date(ticket.slaResponseDueDate).toLocaleString() : "N/A"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Approval:</span> <strong>{ticket.approvalStatus || "none"}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
