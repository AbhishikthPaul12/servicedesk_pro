import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getTickets, getSavedFilters, createSavedFilter, deleteSavedFilter } from "../services/ticketService";
import { Filter, Search, BookmarkPlus, Trash2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

const Tickets = () => {
  const { isEmployee } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [slaStatus, setSlaStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTickets();
    fetchFilters();
  }, [search, status, priority, category, slaStatus, page]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await getTickets({ keyword: search, status, priority, category, slaStatus, page, limit: 10 });
      if (res.success) {
        setTickets(res.tickets || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await getSavedFilters();
      if (res.success) setSavedFilters(res.savedFilters || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;
    try {
      await createSavedFilter({ name: filterName, filters: { status, priority, category, slaStatus, keyword: search } });
      setFilterName("");
      fetchFilters();
    } catch (err) {
      console.error(err);
    }
  };

  const applyFilter = (f) => {
    setStatus(f.filters.status || "");
    setPriority(f.filters.priority || "");
    setCategory(f.filters.category || "");
    setSlaStatus(f.filters.slaStatus || "");
    setSearch(f.filters.keyword || "");
    setPage(1);
  };

  const handleDeleteSavedFilter = async (id) => {
    try {
      await deleteSavedFilter(id);
      fetchFilters();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div className="page-header" variants={rowVariants}>
        <div>
          <h1 className="page-title">
            {isEmployee ? "My Support Tickets" : "Helpdesk Ticket Management"}
          </h1>
          <p className="page-subtitle">Filter, search, and track service desk tickets.</p>
        </div>
        {isEmployee && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/tickets/new" className="btn btn-primary">
              <PlusCircle size={16} /> Create Ticket
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* SAVED FILTERS */}
      {savedFilters.length > 0 && (
        <motion.div
          style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "18px", flexWrap: "wrap" }}
          variants={rowVariants}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Saved Filters:</span>
          {savedFilters.map((sf) => (
            <div
              key={sf._id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "var(--bg-surface-subtle)",
                border: "1px solid var(--border-subtle)",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "0.82rem",
                color: "var(--text-primary)",
              }}
            >
              <span style={{ cursor: "pointer", fontWeight: 500 }} onClick={() => applyFilter(sf)}>
                {sf.name}
              </span>
              <button
                onClick={() => handleDeleteSavedFilter(sf._id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", alignItems: "center" }}
                title="Remove filter"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* FILTER CONTROLS */}
      <motion.div className="filters-bar" variants={rowVariants}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            placeholder="Search keyword or Ticket ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="form-select" style={{ width: "auto" }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="reopened">Reopened</option>
        </select>

        <select className="form-select" style={{ width: "auto" }} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select className="form-select" style={{ width: "auto" }} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          <option value="hardware">Hardware</option>
          <option value="software">Software</option>
          <option value="network">Network</option>
          <option value="access">Access & Security</option>
          <option value="other">Other</option>
        </select>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="form-input"
            style={{ width: "140px" }}
            placeholder="Save filter name"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <motion.button
            onClick={handleSaveFilter}
            className="btn btn-secondary"
            title="Save current filter"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <BookmarkPlus size={16} /> Save
          </motion.button>
        </div>
      </motion.div>

      {/* TICKETS TABLE */}
      <motion.div className="card" variants={rowVariants}>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Requester</th>
                <th>Assigned To</th>
                <th>SLA Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    <div className="spinner" style={{ margin: "0 auto 10px" }} />
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                    No tickets found matching criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket, i) => (
                  <motion.tr
                    key={ticket._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.22 }}
                  >
                    <td style={{ fontWeight: 600, color: "var(--primary)" }}>{ticket.ticketNumber}</td>
                    <td style={{ fontWeight: 500 }}>{ticket.title}</td>
                    <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{ticket.category}</td>
                    <td><span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span></td>
                    <td><span className={`badge badge-${ticket.status}`}>{ticket.status.replace("_", " ")}</span></td>
                    <td style={{ color: "var(--text-secondary)" }}>{ticket.createdBy ? ticket.createdBy.name : "N/A"}</td>
                    <td>{ticket.assignedTo ? ticket.assignedTo.name : <em style={{ color: "var(--text-muted)" }}>Unassigned</em>}</td>
                    <td>
                      <span className={`badge ${ticket.slaStatus === "breached" ? "badge-critical" : "badge-low"}`}>
                        {ticket.slaStatus || "active"}
                      </span>
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket._id}`} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                        View
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <motion.button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            whileHover={{ scale: page > 1 ? 1.04 : 1 }}
            whileTap={{ scale: 0.97 }}
          >
            Previous
          </motion.button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Page {page} of {totalPages}
          </span>
          <motion.button
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            whileHover={{ scale: page < totalPages ? 1.04 : 1 }}
            whileTap={{ scale: 0.97 }}
          >
            Next
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Tickets;
