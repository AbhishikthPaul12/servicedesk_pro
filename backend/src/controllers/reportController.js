import {
    getTicketReport,
    getAssetReport,
    getTechnicianReport
} from "../services/reportService.js";
import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";

export const ticketReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const report = await getTicketReport({
            startDate,
            endDate
        });

        return res.status(200).json({
            success: true,
            message: "Ticket report generated successfully",
            report
        });
    } catch (error) {
        next(error);
    }
};

export const assetReport = async (req, res, next) => {
    try {
        const report = await getAssetReport();

        return res.status(200).json({
            success: true,
            message: "Asset report generated successfully",
            report
        });
    } catch (error) {
        next(error);
    }
};

export const technicianReport = async (req, res, next) => {
    try {
        const report = await getTechnicianReport();

        return res.status(200).json({
            success: true,
            message: "Technician report generated successfully",
            report
        });
    } catch (error) {
        next(error);
    }
};

export const exportTicketsCSV = async (req, res, next) => {
    try {
        const tickets = await Ticket.find()
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email")
            .populate("department", "name")
            .sort({ createdAt: -1 });

        const headers = ["Ticket Number", "Title", "Category", "Priority", "Status", "Created By", "Assigned To", "Department", "SLA Status", "Created At"];
        const rows = tickets.map((t) => [
            `"${t.ticketNumber}"`,
            `"${(t.title || "").replace(/"/g, '""')}"`,
            `"${t.category || ""}"`,
            `"${t.priority || ""}"`,
            `"${t.status || ""}"`,
            `"${t.createdBy ? t.createdBy.name : ""}"`,
            `"${t.assignedTo ? t.assignedTo.name : ""}"`,
            `"${t.department ? t.department.name : ""}"`,
            `"${t.slaStatus || ""}"`,
            `"${t.createdAt ? t.createdAt.toISOString() : ""}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="ticket_report.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

export const exportAssetsCSV = async (req, res, next) => {
    try {
        const assets = await Asset.find()
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        const headers = ["Asset Tag", "Name", "Type", "Brand", "Model", "Serial Number", "Status", "Assigned To", "Purchase Date", "Warranty Expiry"];
        const rows = assets.map((a) => [
            `"${a.assetTag}"`,
            `"${(a.name || "").replace(/"/g, '""')}"`,
            `"${a.type || ""}"`,
            `"${a.brand || ""}"`,
            `"${a.model || ""}"`,
            `"${a.serialNumber || ""}"`,
            `"${a.status || ""}"`,
            `"${a.assignedTo ? a.assignedTo.name : ""}"`,
            `"${a.purchaseDate ? a.purchaseDate.toISOString().split("T")[0] : ""}"`,
            `"${a.warrantyExpiry ? a.warrantyExpiry.toISOString().split("T")[0] : ""}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="asset_report.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

export const exportTechniciansCSV = async (req, res, next) => {
    try {
        const report = await getTechnicianReport();

        const headers = ["Technician ID", "Name", "Email", "Role", "Department", "Assigned", "In Progress", "Resolved", "Closed"];
        const rows = report.map((item) => [
            `"${item.technician.id}"`,
            `"${item.technician.name}"`,
            `"${item.technician.email}"`,
            `"${item.technician.role}"`,
            `"${item.technician.department || ""}"`,
            item.assigned,
            item.inProgress,
            item.resolved,
            item.closed
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="technician_report.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};