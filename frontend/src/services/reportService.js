import API from "./api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const getTicketReport = async (params = {}) => {
  const res = await API.get("/reports/tickets", { params });
  return res.data;
};

export const getAssetReport = async () => {
  const res = await API.get("/reports/assets");
  return res.data;
};

export const getTechnicianReport = async () => {
  const res = await API.get("/reports/technicians");
  return res.data;
};

// Helper for authenticated blob file download
const triggerBlobDownload = (data, filename, type = "text/csv;charset=utf-8;") => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// CSV Export Handlers (authenticated via API client)
export const exportTicketsCSV = async () => {
  const res = await API.get("/reports/tickets/export", { responseType: "blob" });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(res.data, `ServiceDesk_Tickets_${dateStr}.csv`);
};

export const exportAssetsCSV = async () => {
  const res = await API.get("/reports/assets/export", { responseType: "blob" });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(res.data, `ServiceDesk_Assets_${dateStr}.csv`);
};

export const exportTechniciansCSV = async () => {
  const res = await API.get("/reports/technicians/export", { responseType: "blob" });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(res.data, `ServiceDesk_Technicians_${dateStr}.csv`);
};

// PDF Export Handlers using jsPDF & autoTable
export const exportTicketsPDF = (ticketData) => {
  if (!ticketData) return;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleString();

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("ServiceDesk Pro", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("SLA Compliance & Ticket Performance Report", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${dateStr}`, 14, 34);

  // Summary Metrics Section
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Tickets: ${ticketData.totalTickets || 0}`, 14, 44);

  let currentY = 50;

  // SLA Compliance Table
  if (ticketData.slaBreakdown && ticketData.slaBreakdown.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [["SLA Status", "Count", "Percentage"]],
      body: ticketData.slaBreakdown.map((s) => {
        const total = ticketData.totalTickets || 1;
        const pct = ((s.count / total) * 100).toFixed(1);
        return [s.slaStatus.toUpperCase(), s.count, `${pct}%`];
      }),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 }
    });
    currentY = doc.lastAutoTable.finalY + 12;
  }

  // Status Breakdown Table
  if (ticketData.statusBreakdown && ticketData.statusBreakdown.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Tickets by Status", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Status", "Ticket Count"]],
      body: ticketData.statusBreakdown.map((item) => [
        (item._id || "unknown").replace("_", " ").toUpperCase(),
        item.count
      ]),
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 }
    });
    currentY = doc.lastAutoTable.finalY + 12;
  }

  // Category Breakdown Table
  if (ticketData.categoryBreakdown && ticketData.categoryBreakdown.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Tickets by Category", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Category", "Ticket Count"]],
      body: ticketData.categoryBreakdown.map((item) => [
        (item._id || "general").toUpperCase(),
        item.count
      ]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });
  }

  doc.save(`ServiceDesk_Ticket_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportTechniciansPDF = (techData) => {
  if (!techData || techData.length === 0) return;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("ServiceDesk Pro", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("Technician Workload & Resolution Metrics Report", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${dateStr}`, 14, 34);

  const tableBody = techData.map((item) => [
    item.technician.name,
    item.technician.email,
    item.technician.role,
    item.technician.department || "General",
    item.assigned,
    item.inProgress,
    item.resolved,
    item.closed
  ]);

  autoTable(doc, {
    startY: 42,
    head: [["Name", "Email", "Role", "Department", "Assigned", "In Progress", "Resolved", "Closed"]],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 8 }
  });

  doc.save(`ServiceDesk_Technician_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportAssetsPDF = (assetData) => {
  if (!assetData) return;
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("ServiceDesk Pro", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("Asset Lifecycle & Inventory Summary Report", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${dateStr}`, 14, 34);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Assets: ${assetData.totalAssets || 0}`, 14, 44);

  let currentY = 50;

  if (assetData.statusBreakdown && assetData.statusBreakdown.length > 0) {
    doc.setFontSize(11);
    doc.text("Assets by Status", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Status", "Count"]],
      body: assetData.statusBreakdown.map((item) => [
        (item._id || "unknown").replace("_", " ").toUpperCase(),
        item.count
      ]),
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6] },
      styles: { fontSize: 9 }
    });
    currentY = doc.lastAutoTable.finalY + 12;
  }

  if (assetData.typeBreakdown && assetData.typeBreakdown.length > 0) {
    doc.setFontSize(11);
    doc.text("Assets by Type", 14, currentY);

    autoTable(doc, {
      startY: currentY + 4,
      head: [["Asset Type", "Count"]],
      body: assetData.typeBreakdown.map((item) => [
        (item._id || "hardware").replace("_", " ").toUpperCase(),
        item.count
      ]),
      theme: "striped",
      headStyles: { fillColor: [13, 148, 136] },
      styles: { fontSize: 9 }
    });
  }

  doc.save(`ServiceDesk_Asset_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
