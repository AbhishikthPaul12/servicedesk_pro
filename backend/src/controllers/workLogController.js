import WorkLog from "../models/WorkLog.js";
import Ticket from "../models/Ticket.js";
import { createAuditLog } from "../services/auditService.js";
import {
    canAccessTicket,
    canCreateWorkLog,
    canViewWorkLogs,
    canDeleteWorkLog,
    deny
} from "../utils/authorization.js";
import { isITManager, normalizeRole } from "../utils/roles.js";
import { maybeRecordFirstResponse } from "../services/firstResponseService.js";

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

        if (isITManager(req.user)) {
            return deny(
                res,
                "IT Managers may view work logs but cannot create them as technician work"
            );
        }

        if (!canCreateWorkLog(req.user, ticket)) {
            return deny(
                res,
                "You can only create work logs for tickets assigned to you"
            );
        }

        const workLog = await WorkLog.create({
            ticket: ticketId,
            technician: req.user._id,
            description,
            timeSpent: Number(timeSpent)
        });

        await createAuditLog({
            ticket: ticketId,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "updated",
            description: `Work log added: ${timeSpent} minutes spent`
        });

        await maybeRecordFirstResponse(ticket, req.user);

        const populatedLog = await WorkLog.findById(workLog._id).populate(
            "technician",
            "name email role"
        );

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

        if (!canViewWorkLogs(req.user, ticket)) {
            return deny(res, "You are not authorized to view work logs for this ticket");
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to view this ticket");
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

        const ticket = await Ticket.findById(workLog.ticket);
        if (ticket && !canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to modify this ticket");
        }

        if (!canDeleteWorkLog(req.user, workLog)) {
            return deny(res, "You are not authorized to delete this work log");
        }

        await workLog.deleteOne();

        await createAuditLog({
            ticket: workLog.ticket,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "updated",
            description: "Work log deleted"
        });

        res.status(200).json({
            success: true,
            message: "Work log deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
