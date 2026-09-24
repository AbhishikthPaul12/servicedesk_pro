import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOverview, getTechniciansAnalytics } from "../services/dashboardService";
import { getTickets } from "../services/ticketService";
import { Link } from "react-router-dom";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  TrendingUp,
  Activity,
  Users,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardMarquee from "../components/DashboardMarquee";
import { getRoleLabel } from "../utils/roles";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: "easeOut" } },
};

const Dashboard = () => {
  const { user, isSystemAdmin, isITManager, isTechnician, isEmployee, role } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [techWorkload, setTechWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isSystemAdmin || isITManager) {
        const overviewRes = await getOverview();
        if (overviewRes.success) setStats(overviewRes.data);
        const techRes = await getTechniciansAnalytics();
        if (techRes.success) setTechWorkload(techRes.data || []);
      }
      const ticketsRes = await getTickets({ limit: 6 });
      if (ticketsRes.success) setRecentTickets(ticketsRes.tickets || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: <Ticket size={24} />,
      value: stats ? stats.tickets?.total : recentTickets.length,
      label: isEmployee ? "My Total Tickets" : "Total Helpdesk Tickets",
      color: "var(--primary)",
      bg: "var(--primary-light)",
    },
    {
      icon: <Clock size={24} />,
      value: stats
        ? (stats.tickets?.open || 0) + (stats.tickets?.in_progress || 0)
        : recentTickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
      label: "Active / In Progress",
      color: "var(--warning)",
      bg: "var(--warning-light)",
    },
    {
      icon: <CheckCircle2 size={24} />,
      value: stats
        ? (stats.tickets?.resolved || 0) + (stats.tickets?.closed || 0)
        : recentTickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
      label: "Resolved & Closed",
      color: "var(--success)",
      bg: "var(--success-light)",
    },
    {
      icon: <AlertTriangle size={24} />,
      value: stats ? stats.sla?.breached || 0 : 0,
      label: "SLA Breached",
      color: "var(--danger)",
      bg: "var(--danger-light)",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {}
      <motion.div className="page-header" variants={itemVariants}>
        <div>
          <h1 className="page-title">Welcome back, {user?.name}</h1>
          <p className="page-subtitle">
            Enterprise Helpdesk Workspace &middot; Role:{" "}
            <strong style={{ color: "var(--primary)" }}>{getRoleLabel(role)}</strong>
          </p>
        </div>
        {isEmployee && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/tickets/new" className="btn btn-primary">
              <Plus size={17} /> Create Ticket
            </Link>
          </motion.div>
        )}
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        <DashboardMarquee />
      </motion.div>

      {loading ? (
        <motion.div
          className="card"
          style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="spinner" style={{ margin: "0 auto 16px auto" }} />
          <p>Loading operational metrics and real-time activity...</p>
        </motion.div>
      ) : (
        <>
          {}
          <motion.div className="grid-cols-4" variants={containerVariants}>
            {statCards.map((card, i) => (
              <motion.div
                key={i}
                className="stat-card"
                variants={cardVariants}
                whileHover={{
                  translateY: -5,
                  boxShadow: "var(--shadow-md)",
                  transition: { duration: 0.22 },
                }}
              >
                <div
                  className="stat-icon"
                  style={{ backgroundColor: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
                <div>
                  <motion.div
                    className="stat-value"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.4, type: "spring" }}
                  >
                    {card.value ?? 0}
                  </motion.div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {}
          {(isSystemAdmin || isITManager) && stats?.sla && (
            <motion.div className="card" variants={itemVariants} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <ShieldAlert size={20} style={{ color: "var(--primary)" }} />
                <h3 className="section-title" style={{ margin: 0 }}>SLA Compliance Overview</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "16px" }}>
                {[
                  { label: "Active", value: stats.sla.active || 0, color: "var(--info)" },
                  { label: "At Risk", value: stats.sla.at_risk || 0, color: "var(--warning)" },
                  { label: "Met", value: stats.sla.met || 0, color: "var(--success)" },
                  { label: "Breached", value: stats.sla.breached || 0, color: "var(--danger)" },
                  { label: "Escalated", value: stats.sla.escalated || stats.tickets?.escalated || 0, color: "var(--danger)" },
                  { label: "Compliance %", value: `${stats.sla.compliancePercentage ?? 0}%`, color: "var(--primary)" },
                  { label: "Pending Approvals", value: stats.tickets?.pendingApprovals || 0, color: "var(--warning)" },
                  { label: "Unassigned", value: stats.tickets?.unassigned || 0, color: "var(--info)" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      textAlign: "center",
                    }}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {}
          {(isSystemAdmin || isITManager) && techWorkload.length > 0 && (
            <motion.div className="card" variants={itemVariants} style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Users size={20} style={{ color: "var(--primary)" }} />
                <h3 className="section-title" style={{ margin: 0 }}>Technician Workload Distribution</h3>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Total</th>
                      <th>Open</th>
                      <th>In Progress</th>
                      <th>Resolved</th>
                      <th>Closed</th>
                      <th>SLA Breached</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techWorkload.map((tech, i) => (
                      <motion.tr
                        key={tech.technicianId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <td style={{ fontWeight: 600 }}>
                          <div>{tech.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{tech.email}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>{tech.total}</td>
                        <td>{tech.open || 0}</td>
                        <td>{tech.in_progress || 0}</td>
                        <td style={{ color: "var(--success)" }}>{tech.resolved || 0}</td>
                        <td>{tech.closed || 0}</td>
                        <td>
                          {tech.breached > 0 ? (
                            <span className="badge badge-critical">{tech.breached}</span>
                          ) : (
                            <span className="badge badge-low">0</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {}
          <motion.div className="card" variants={itemVariants}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 className="section-title">
                  {isEmployee
                    ? "My Recent Tickets"
                    : isTechnician
                    ? "Assigned Ticket Workload"
                    : "Recent Helpdesk Activity"}
                </h3>
                <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Live tickets currently registered within your authorization scope
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/tickets"
                  className="btn btn-secondary"
                  style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                >
                  View All <ArrowRight size={15} />
                </Link>
              </motion.div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}
                      >
                        No tickets currently in your queue.
                      </td>
                    </tr>
                  ) : (
                    recentTickets.map((ticket, i) => (
                      <motion.tr
                        key={ticket._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                      >
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                          {ticket.ticketNumber}
                        </td>
                        <td style={{ fontWeight: 600 }}>{ticket.title}</td>
                        <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>
                          {ticket.category}
                        </td>
                        <td>
                          <span className={`badge badge-${ticket.priority}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${ticket.status}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              ticket.slaStatus === "breached" ? "badge-critical" : "badge-low"
                            }`}
                          >
                            {ticket.slaStatus || "active"}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/tickets/${ticket._id}`}
                            className="btn btn-secondary"
                            style={{ padding: "5px 12px", fontSize: "0.8rem" }}
                          >
                            Open
                          </Link>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Dashboard;
