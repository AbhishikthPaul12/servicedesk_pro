import Ticket from "../models/Ticket.js";
import TicketComment from "../models/TicketComment.js";
import { createNotification } from "../services/notificationService.js";
import { createAuditLog } from "../services/auditService.js";
import { canAccessTicket, deny } from "../utils/authorization.js";
import {
    canSeeInternalNotes,
    isEmployee,
    isAssetManager,
    normalizeRole,
    sameId
} from "../utils/roles.js";
import { maybeRecordFirstResponse } from "../services/firstResponseService.js";

export const addComment = async (req, res, next) => {
    try {
        const { content, isInternal } = req.body;
        let type = req.body.type || "comment";

        // Normalize frontend isInternal boolean → type
        if (isInternal === true || isInternal === "true") {
            type = "internal_note";
        } else if (isInternal === false || isInternal === "false") {
            type = "comment";
        }

        const ticket = await Ticket.findById(req.params.ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to comment on this ticket");
        }

        if (isAssetManager(req.user)) {
            return deny(res, "Asset managers cannot comment on tickets");
        }

        if (type === "internal_note") {
            if (!canSeeInternalNotes(req.user)) {
                return deny(res, "You do not have permission to create internal notes");
            }
            if (isEmployee(req.user)) {
                return deny(res, "Employees cannot create internal notes");
            }
        }

        const attachments = (req.files || []).map((f) => ({
            filename: f.originalname,
            url: `/uploads/${f.filename}`
        }));

        const comment = await TicketComment.create({
            ticket: ticket._id,
            user: req.user._id,
            content,
            type,
            attachments
        });

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "commented",
            description:
                type === "internal_note"
                    ? "Internal note added to ticket"
                    : "Comment added to ticket"
        });

        await maybeRecordFirstResponse(ticket, req.user);

        if (type === "comment") {
            if (!sameId(ticket.createdBy, req.user._id)) {
                await createNotification({
                    recipient: ticket.createdBy,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Comment on Your Ticket",
                    message: `${req.user.name} added a comment on ticket ${ticket.ticketNumber}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`
                }).catch((err) => console.error("Notification error:", err.message));
            }

            if (ticket.assignedTo && !sameId(ticket.assignedTo, req.user._id)) {
                await createNotification({
                    recipient: ticket.assignedTo,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Comment on Assigned Ticket",
                    message: `${req.user.name} added a comment on ticket ${ticket.ticketNumber}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`
                }).catch((err) => console.error("Notification error:", err.message));
            }
        } else if (type === "internal_note") {
            if (ticket.assignedTo && !sameId(ticket.assignedTo, req.user._id)) {
                await createNotification({
                    recipient: ticket.assignedTo,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Internal Note Added",
                    message: `${req.user.name} posted an internal note on ticket ${ticket.ticketNumber}.`
                }).catch((err) => console.error("Notification error:", err.message));
            }
        }

        const populatedComment = await TicketComment.findById(comment._id).populate(
            "user",
            "name email role"
        );

        res.status(201).json({
            success: true,
            message:
                type === "internal_note"
                    ? "Internal note added successfully"
                    : "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketComments = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to view comments on this ticket");
        }

        const query = { ticket: ticket._id };

        // Employees (and anyone not internal staff) must never see internal notes
        if (!canSeeInternalNotes(req.user)) {
            query.type = "comment";
        }

        const comments = await TicketComment.find(query)
            .populate("user", "name email role")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: comments.length,
            comments
        });
    } catch (error) {
        next(error);
    }
};
