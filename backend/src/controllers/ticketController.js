import Ticket from "../models/Ticket.js";
import Department from "../models/Department.js";
import User from "../models/User.js"
import AuditLog from "../models/AuditLog.js";
import { isValidTransition } from "../utils/ticketWorkflow.js";
import {
    getSLAForPriority,
    calculateSLADueDate,
    evaluateSLAStatus
} from "../services/slaService.js";

export const createTicket = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            priority = "medium",
            department
        } = req.body;

        // Find SLA based on ticket priority
        const sla = await getSLAForPriority(priority);

        if (!sla) {
            return res.status(500).json({
                success: false,
                message: `No active SLA configured for priority: ${priority}`
            });
        }

        // Generate ticket number
        const year = new Date().getFullYear();

        const count = await Ticket.countDocuments();

        const ticketNumber = `SD-${year}-${String(
            count + 1
        ).padStart(5, "0")}`;

        // Calculate SLA deadline
        const createdAt = new Date();

        const slaDueDate = calculateSLADueDate(
            createdAt,
            sla.resolutionTime
        );

        // Handle uploaded attachments
        const attachments = (req.files || []).map((f) => ({
            filename: f.originalname,
            url: `/uploads/${f.filename}`
        }));

        // Create ticket
        const ticket = await Ticket.create({
            ticketNumber,
            title,
            description,
            category,
            priority,
            createdBy: req.user._id,
            department: department || null,
            sla: sla._id,
            slaDueDate,
            slaStatus: "active",
            attachments
        });

        // Create audit log
        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "created",
            description: `Ticket ${ticket.ticketNumber} created with ${priority} priority and ${sla.name}`
        });

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate("createdBy", "name email role")
            .populate("department", "name")
            .populate("sla", "name priority responseTime resolutionTime");

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const getTickets = async (req, res, next) => {
    try {
        const {
            status,
            priority,
            category,
            assignedTo,
            department,
            slaStatus,
            keyword,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = {};

        const userRole = req.user.role;
        const isSystemAdmin = userRole === "system_admin" || userRole === "admin";
        const isITManager = userRole === "it_manager" || userRole === "manager";
        const isTechnician = userRole === "technician";
        const isEmployee = userRole === "employee";
        const isAssetManager = userRole === "asset_manager";

        if (isEmployee || isAssetManager) {
            filter.createdBy = req.user._id;
        } else if (isTechnician) {
            const techConditions = [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ];
            if (req.user.department) {
                techConditions.push({ department: req.user.department });
            }
            filter.$or = techConditions;
        } else if (isITManager && req.user.department) {
            filter.department = req.user.department;
        }

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (category) {
            filter.category = category;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        if (department) {
            filter.department = department;
        }

        if (slaStatus) {
            filter.slaStatus = slaStatus;
        }

        if (keyword) {
            const keywordFilter = [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { ticketNumber: { $regex: keyword, $options: "i" } }
            ];
            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: keywordFilter }
                ];
                delete filter.$or;
            } else {
                filter.$or = keywordFilter;
            }
        }

        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                filter.createdAt.$lte = end;
            }
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "priority",
            "status",
            "slaDueDate",
            "ticketNumber"
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const safeOrder = order === "asc" ? 1 : -1;

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate("createdBy", "name email")
                .populate("assignedTo", "name email role")
                .populate("department", "name")
                .populate(
                    "sla",
                    "name priority responseTime resolutionTime"
                )
                .sort({ [safeSortBy]: safeOrder })
                .skip(skip)
                .limit(limitNumber),

            Ticket.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: tickets.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            filters: {
                status: status || null,
                priority: priority || null,
                category: category || null,
                assignedTo: assignedTo || null,
                department: department || null,
                slaStatus: slaStatus || null,
                keyword: keyword || null,
                startDate: startDate || null,
                endDate: endDate || null
            },
            tickets
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketById = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("department", "name");

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const userRole = req.user.role;
        const isSystemAdmin = userRole === "system_admin" || userRole === "admin";
        const isITManager = userRole === "it_manager" || userRole === "manager";
        const isTechnician = userRole === "technician";
        const isCreator = ticket.createdBy && (ticket.createdBy._id || ticket.createdBy).toString() === req.user._id.toString();
        const isAssigned = ticket.assignedTo && (ticket.assignedTo._id || ticket.assignedTo).toString() === req.user._id.toString();
        const isSameDept = req.user.department && ticket.department && (ticket.department._id || ticket.department).toString() === req.user.department.toString();

        if (!isSystemAdmin) {
            if (isITManager && !isSameDept && req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view tickets outside your department"
                });
            }
            if (isTechnician && !isAssigned && !isSameDept && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this ticket"
                });
            }
            if (!isITManager && !isTechnician && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this ticket"
                });
            }
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        next(error);
    }
};

export const updateTicket = async (req, res, next) => {
    try {
        const existingTicket = await Ticket.findById(req.params.id);

        if (!existingTicket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const userRole = req.user.role;
        const isSystemAdmin = userRole === "system_admin" || userRole === "admin";
        const isITManager = userRole === "it_manager" || userRole === "manager";
        const isTechnician = userRole === "technician";
        const isCreator = existingTicket.createdBy.toString() === req.user._id.toString();
        const isAssigned = existingTicket.assignedTo && existingTicket.assignedTo.toString() === req.user._id.toString();
        const isSameDept = req.user.department && existingTicket.department && existingTicket.department.toString() === req.user.department.toString();

        if (!isSystemAdmin) {
            if (isITManager && !isSameDept && req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update tickets outside your department"
                });
            }
            if (isTechnician && !isAssigned && !isSameDept && !isCreator) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this ticket"
                });
            }
            if (!isITManager && !isTechnician) {
                if (!isCreator) {
                    return res.status(403).json({
                        success: false,
                        message: "You are not authorized to update this ticket"
                    });
                }
                const allowedEmployeeStatuses = ["closed", "reopened"];
                if (req.body.status && !allowedEmployeeStatuses.includes(req.body.status)) {
                    return res.status(403).json({
                        success: false,
                        message: "Employees can only confirm resolution (close) or reopen tickets"
                    });
                }
            }
        }

        const updates = {};

        const allowedFields = [
            "title",
            "description",
            "category",
            "priority",
            "department",
            "dueDate",
            "resolution"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Handle status separately
        if (req.body.status !== undefined) {
            const isValid = isValidTransition(
                existingTicket.status,
                req.body.status
            );

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from ${existingTicket.status} to ${req.body.status}`
                });
            }

            updates.status = req.body.status;
        }

        const previousStatus = existingTicket.status;
        // Save the updated ticket
        Object.assign(existingTicket, updates);

        if (
    req.body.status === "resolved" &&
    previousStatus !== "resolved"
) {
    existingTicket.resolvedAt = new Date();
}

if (req.body.status === "reopened") {
    existingTicket.resolvedAt = null;
}

existingTicket.slaStatus = evaluateSLAStatus(existingTicket);

        await existingTicket.save();

        // Create audit log for status changes
        if (
    req.body.status !== undefined &&
    previousStatus !== req.body.status
) {
    let action = "status_changed";

    if (req.body.status === "resolved") {
        action = "resolved";
    }

    if (req.body.status === "closed") {
        action = "closed";
    }

    if (req.body.status === "reopened") {
        action = "reopened";
    }

    await AuditLog.create({
        ticket: existingTicket._id,
        user: req.user._id,
        action,
        field: "status",
        oldValue: previousStatus,
        newValue: req.body.status,
        description: `Ticket status changed from ${previousStatus} to ${req.body.status}`
    });
}

        const populatedTicket = await Ticket.findById(existingTicket._id)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("department", "name");

        res.status(200).json({
            success: true,
            message: "Ticket updated successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const assignTicket = async (req, res, next) => {
    try {
        const { technicianId } = req.body;

        const technician = await User.findById(technicianId);

        if (!technician) {
            return res.status(404).json({
                success: false,
                message: "Technician not found"
            });
        }

        if (technician.role !== "technician") {
            return res.status(400).json({
                success: false,
                message: "User is not a technician"
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const previousAssignee = ticket.assignedTo;

        ticket.assignedTo = technicianId;

        if (ticket.status === "open") {
            ticket.status = "assigned";
        }

        await ticket.save();

        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "assigned",
            field: "assignedTo",
            oldValue: previousAssignee
                ? previousAssignee.toString()
                : null,
            newValue: technicianId.toString(),
            description: `Ticket assigned to ${technician.name}`
        });

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("department", "name");

        res.status(200).json({
            success: true,
            message: "Ticket assigned successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const uploadTicketAttachment = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        const isCreator = ticket.createdBy.toString() === req.user._id.toString();
        const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user._id.toString();
        const userRole = req.user.role;
        const isAdmin = userRole === "system_admin" || userRole === "admin";
        const isManager = userRole === "it_manager" || userRole === "manager";

        if (!isAdmin && !isManager && !isAssigned && !isCreator) {
            return res.status(403).json({ success: false, message: "Not authorized to attach files to this ticket" });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: "No files uploaded" });
        }

        const newAttachments = req.files.map((f) => ({
            filename: f.originalname,
            url: `/uploads/${f.filename}`
        }));

        ticket.attachments.push(...newAttachments);
        await ticket.save();

        await AuditLog.create({
            ticket: ticket._id,
            user: req.user._id,
            action: "updated",
            description: `${req.files.length} attachment(s) added to ticket`
        });

        res.status(200).json({
            success: true,
            message: `${req.files.length} file(s) attached successfully`,
            attachments: ticket.attachments
        });
    } catch (error) {
        next(error);
    }
};