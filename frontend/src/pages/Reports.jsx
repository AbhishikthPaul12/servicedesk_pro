import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getTicketReport,
  getAssetReport,
  getTechnicianReport,
  exportTicketsCSV,
  exportAssetsCSV,
  exportTechniciansCSV,
  exportTicketsPDF,
  exportTechniciansPDF,
  exportAssetsPDF
} from "../services/reportService";
import { Download, BarChart2, ShieldCheck, Clock, Users, HardDrive, FileSpreadsheet, FileText, Printer } from "lucide-react";

const Reports = () => {
  const { isSystemAdmin, isITManager, isAssetManager } = useAuth();
  const [ticketData, setTicketData] = useState(null);
  const [assetData, setAssetData] = useState(null);
  const [techData, setTechData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (isSystemAdmin || isITManager) {
        const [ticketRes, techRes] = await Promise.all([
          getTicketReport(),
          getTechnicianReport()
        ]);
        if (ticketRes.success) setTicketData(ticketRes.report);
        if (techRes.success) setTechData(techRes.report || []);
      }

      if (isSystemAdmin || isAssetManager) {
        const assetRes = await getAssetReport();
        if (assetRes.success) setAssetData(assetRes.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (exportFn) => {
    try {
      setExporting(true);
      await exportFn();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Operational Analytics</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>SLA compliance, technician workload, asset distribution, with ready CSV and PDF exports.</p>
        </div>

        {}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(isSystemAdmin || isITManager) && (
            <>
              <button onClick={() => handleExportCSV(exportTicketsCSV)} disabled={exporting} className="btn btn-secondary">
                <FileSpreadsheet size={16} color="#16a34a" /> Ticket CSV
              </button>
              <button onClick={() => exportTicketsPDF(ticketData)} disabled={!ticketData} className="btn btn-secondary">
                <FileText size={16} color="#dc2626" /> Ticket PDF
              </button>
              <button onClick={() => handleExportCSV(exportTechniciansCSV)} disabled={exporting} className="btn btn-secondary">
                <FileSpreadsheet size={16} color="#2563eb" /> Technician CSV
              </button>
              <button onClick={() => exportTechniciansPDF(techData)} disabled={!techData.length} className="btn btn-secondary">
                <FileText size={16} color="#dc2626" /> Technician PDF
              </button>
            </>
          )}

          {(isSystemAdmin || isAssetManager) && (
            <>
              <button onClick={() => handleExportCSV(exportAssetsCSV)} disabled={exporting} className="btn btn-secondary">
                <FileSpreadsheet size={16} color="#d97706" /> Asset CSV
              </button>
              <button onClick={() => exportAssetsPDF(assetData)} disabled={!assetData} className="btn btn-secondary">
                <FileText size={16} color="#dc2626" /> Asset PDF
              </button>
            </>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              const style = document.createElement("style");
              style.id = "print-hide";
              style.innerHTML = `@media print { .sidebar, .topbar, .page-header button, .btn { display: none !important; } }`;
              document.head.appendChild(style);
              window.print();
              setTimeout(() => document.getElementById("print-hide")?.remove(), 1000);
            }}
          >
            <Printer size={16} /> Print View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>Loading analytical report data...</div>
      ) : (
        <>
          {}
          {(isSystemAdmin || isITManager) && ticketData && (
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                <Clock size={20} color="var(--primary)" /> SLA Compliance & Ticket Performance
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ padding: "16px", backgroundColor: "var(--bg-surface-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>{ticketData.totalTickets}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total Organization Tickets</div>
                </div>

                {ticketData.slaBreakdown?.map((sla, idx) => (
                  <div key={idx} style={{ padding: "16px", backgroundColor: sla.slaStatus === "breached" ? "var(--danger-light)" : "var(--success-light)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: sla.slaStatus === "breached" ? "var(--danger)" : "var(--success)" }}>
                      {sla.count}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      SLA {sla.slaStatus}
                    </div>
                  </div>
                ))}
              </div>

              {}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Tickets by Status</h4>
                  <ul style={{ listStyle: "none" }}>
                    {ticketData.statusBreakdown?.map((item) => (
                      <li key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--text-secondary)" }}>{item._id?.replace("_", " ")}</span>
                        <strong style={{ color: "var(--text-primary)" }}>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Tickets by Category</h4>
                  <ul style={{ listStyle: "none" }}>
                    {ticketData.categoryBreakdown?.map((item) => (
                      <li key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--text-secondary)" }}>{item._id}</span>
                        <strong style={{ color: "var(--text-primary)" }}>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {}
          {(isSystemAdmin || isITManager) && techData.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Users size={20} color="#16a34a" /> Technician Workload & Resolution Metrics
              </h3>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Technician Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Assigned</th>
                      <th>In Progress</th>
                      <th>Resolved</th>
                      <th>Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techData.map((item) => (
                      <tr key={item.technician.id}>
                        <td style={{ fontWeight: 600 }}>{item.technician.name} ({item.technician.email})</td>
                        <td><span className="badge badge-role">{item.technician.role}</span></td>
                        <td>{item.technician.department || "General"}</td>
                        <td style={{ fontWeight: 700 }}>{item.assigned}</td>
                        <td style={{ color: "#4338ca" }}>{item.inProgress}</td>
                        <td style={{ color: "#16a34a" }}>{item.resolved}</td>
                        <td style={{ color: "#64748b" }}>{item.closed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          {(isSystemAdmin || isAssetManager) && assetData && (
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
                <HardDrive size={20} color="var(--warning)" /> Asset Lifecycle & Inventory Summary
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Assets by Status</h4>
                  <ul style={{ listStyle: "none" }}>
                    {assetData.statusBreakdown?.map((item) => (
                      <li key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--text-secondary)" }}>{item._id}</span>
                        <strong style={{ color: "var(--text-primary)" }}>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>Assets by Type</h4>
                  <ul style={{ listStyle: "none" }}>
                    {assetData.typeBreakdown?.map((item) => (
                      <li key={item._id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500, color: "var(--text-secondary)" }}>{item._id}</span>
                        <strong style={{ color: "var(--text-primary)" }}>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
