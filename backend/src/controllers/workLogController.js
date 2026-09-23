import WorkLog from "../models/WorkLog.js";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";

export const addWorkLog = async (req, res, next) => {
    try {
        const { ticketId } = req.params;
        const { description, timeSpent } = req.body;

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const workLog = await WorkLog.create({
            ticket: ticketId,
            technician: req.user._id,
            description,
            timeSpent: Number(timeSpent)
        });

        await AuditLog.create({
            ticket: ticketId,
            user: req.user._id,
            action: "updated",
            description: `Work log added: ${timeSpent} minutes spent`
        });

        const populatedLog = await WorkLog.findById(workLog._id)
            .populate("technician", "name email role");

        res.status(201).json({
            success: true,
            message: "Work log added successfully",
            workLog: populatedLog
        });
    } catch (error) {
        next(error);
    }
};

export const getWorkLogs = async (req, res, next) => {
    try {
        const { ticketId } = req.params;

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Employees are restricted from internal technician work logs
        if (req.user.role === "employee") {
            return res.status(403).json({
                success: false,
                message: "Employees are not authorized to view internal work logs"
            });
        }

        const workLogs = await WorkLog.find({ ticket: ticketId })
            .populate("technician", "name email role")
            .sort({ createdAt: -1 });

        const totalMinutes = workLogs.reduce((sum, log) => sum + log.timeSpent, 0);

        res.status(200).json({
            success: true,
            count: workLogs.length,
            totalTimeSpentMinutes: totalMinutes,
            workLogs
        });
    } catch (error) {
        next(error);
    }
};

export const deleteWorkLog = async (req, res, next) => {
    try {
        const { id } = req.params;

        const workLog = await WorkLog.findById(id);

        if (!workLog) {
            return res.status(404).json({
                success: false,
                message: "Work log not found"
            });
        }

        const isOwner = workLog.technician.toString() === req.user._id.toString();
        const isAdminOrManager = ["system_admin", "admin", "it_manager", "manager"].includes(req.user.role);

        if (!isOwner && !isAdminOrManager) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this work log"
            });
        }

        await workLog.deleteOne();

        res.status(200).json({
            success: true,
            message: "Work log deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
