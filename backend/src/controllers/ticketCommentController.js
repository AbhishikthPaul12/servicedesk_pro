import Ticket from "../models/Ticket.js";
import TicketComment from "../models/TicketComment.js";
import AuditLog from "../models/AuditLog.js";

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
            !["admin", "manager", "technician"].includes(req.user.role)
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