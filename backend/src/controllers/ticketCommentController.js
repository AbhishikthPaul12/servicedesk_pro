import Ticket from "../models/Ticket.js";
import TicketComment from "../models/TicketComment.js";
import AuditLog from "../models/AuditLog.js";
import { createNotification } from "../services/notificationService.js";

export const addComment = async (req, res, next) => {
    try {
        const { content, type = "comment" } = req.body;

        const ticket = await Ticket.findById(req.params.ticketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Only support staff can create internal notes
        if (
            type === "internal_note" &&
            !["admin", "system_admin", "manager", "it_manager", "technician"].includes(req.user.role)
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to create internal notes"
            });
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

        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "commented",
            description:
                type === "internal_note"
                    ? "Internal note added to ticket"
                    : "Comment added to ticket"
        });

        // Trigger notifications
        if (type === "comment") {
            // Notify ticket creator if commenter is not the creator
            if (ticket.createdBy.toString() !== req.user._id.toString()) {
                await createNotification({
                    recipient: ticket.createdBy,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Comment on Your Ticket",
                    message: `${req.user.name} added a comment on ticket ${ticket.ticketNumber}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`
                }).catch((err) => console.error("Notification error:", err.message));
            }

            // Notify assigned technician if commenter is not technician
            if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user._id.toString()) {
                await createNotification({
                    recipient: ticket.assignedTo,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Comment on Assigned Ticket",
                    message: `${req.user.name} added a comment on ticket ${ticket.ticketNumber}: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}"`
                }).catch((err) => console.error("Notification error:", err.message));
            }
        } else if (type === "internal_note") {
            // Internal note: notify assigned technician if not author
            if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user._id.toString()) {
                await createNotification({
                    recipient: ticket.assignedTo,
                    ticket: ticket._id,
                    type: "ticket_commented",
                    title: "New Internal Note Added",
                    message: `${req.user.name} posted an internal note on ticket ${ticket.ticketNumber}.`
                }).catch((err) => console.error("Notification error:", err.message));
            }
        }

        const populatedComment = await TicketComment.findById(comment._id)
            .populate("user", "name email role");

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

        const query = {
            ticket: ticket._id
        };

        // Employees should not see internal notes
        if (
            !["admin", "manager", "technician"].includes(req.user.role)
        ) {
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