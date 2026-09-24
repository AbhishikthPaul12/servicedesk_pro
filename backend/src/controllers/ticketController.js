import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import {
    isValidTransition,
    isRoleAllowedTransition,
    resolveTechnicianStatus,
    canApproveResolution
} from "../utils/ticketWorkflow.js";
import {
    getSLAForPriority,
    calculateSLADueDate,
    calculateResponseDueDate,
    evaluateSLAStatus,
    getBusinessHours,
    getAtRiskThreshold
} from "../services/slaService.js";
import { createNotification } from "../services/notificationService.js";
import { createAuditLog } from "../services/auditService.js";
import { getDepartmentManagers } from "../services/slaMonitorService.js";
import {
    buildTicketAccessFilter,
    canAccessTicket,
    applyDepartmentScope,
    deny
} from "../utils/authorization.js";
import {
    isSystemAdmin,
    isITManager,
    isTechnician,
    isEmployee,
    sameId,
    normalizeRole
} from "../utils/roles.js";

const populateTicket = (query) =>
    query
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email role")
        .populate("approvedBy", "name email role")
        .populate("escalatedBy", "name email role")
        .populate("department", "name")
        .populate("sla", "name priority responseTime resolutionTime")
        .populate("relatedAssets", "assetTag name status");

export const createTicket = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            priority = "medium",
            department
        } = req.body;

        if (isAssetManagerBlocked(req.user)) {
            return deny(res, "Asset managers cannot create support tickets");
        }

        const sla = await getSLAForPriority(priority);

        if (!sla) {
            return res.status(500).json({
                success: false,
                message: `No active SLA configured for priority: ${priority}`
            });
        }

        const year = new Date().getFullYear();
        const count = await Ticket.countDocuments();
        const ticketNumber = `SD-${year}-${String(count + 1).padStart(5, "0")}`;

        const createdAt = new Date();
        const businessHours = await getBusinessHours();

        const slaDueDate = calculateSLADueDate(
            createdAt,
            sla.resolutionTime,
            businessHours
        );
        const slaResponseDueDate = calculateResponseDueDate(
            createdAt,
            sla.responseTime,
            businessHours
        );

        let ticketDepartment = null;
        if (isEmployee(req.user)) {
            if (!req.user.department) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Your account is not assigned to a department. Please contact an administrator before creating a ticket."
                });
            }
            ticketDepartment = req.user.department;
        } else if (isITManager(req.user)) {
            if (!req.user.department) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Your IT Manager account is not assigned to a department. Please contact a System Admin."
                });
            }
            ticketDepartment = req.user.department;
        } else if (isTechnician(req.user)) {
            if (!req.user.department) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Your Technician account is not assigned to a department. Please contact a System Admin."
                });
            }
            ticketDepartment = req.user.department;
        } else if (isSystemAdmin(req.user)) {
            ticketDepartment = department || req.user.department || null;
        } else {
            ticketDepartment = req.user.department || null;
        }

        const attachments = (req.files || []).map((f) => ({
            filename: f.originalname,
            url: `/uploads/${f.filename}`
        }));

        const ticket = await Ticket.create({
            ticketNumber,
            title,
            description,
            category,
            priority,
            createdBy: req.user._id,
            department: ticketDepartment,
            sla: sla._id,
            slaDueDate,
            slaResponseDueDate,
            slaStatus: "active",
            attachments
        });

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "created",
            description: `Ticket ${ticket.ticketNumber} created with ${priority} priority`
        });

        const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

function isAssetManagerBlocked(user) {
    return normalizeRole(user.role) === "asset_manager";
}

export const getTickets = async (req, res, next) => {
    try {
        if (isAssetManagerBlocked(req.user)) {
            return deny(res, "Asset managers do not have ticket list access");
        }

        if (isITManager(req.user) && !req.user.department) {
            return res.status(403).json({
                success: false,
                message:
                    "Your IT Manager account is not assigned to a department. Please contact a System Admin."
            });
        }

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
            escalated,
            approvalStatus,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = buildTicketAccessFilter(req.user);
        applyDepartmentScope(req.user, filter, department);

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (assignedTo) filter.assignedTo = assignedTo;
        if (slaStatus) filter.slaStatus = slaStatus;
        if (escalated === "true") filter.isEscalated = true;
        if (approvalStatus) filter.approvalStatus = approvalStatus;

        if (keyword) {
            const keywordFilter = [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { ticketNumber: { $regex: keyword, $options: "i" } }
            ];
            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, { $or: keywordFilter }];
                delete filter.$or;
            } else {
                filter.$or = keywordFilter;
            }
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "priority",
            "status",
            "slaDueDate",
            "ticketNumber"
        ];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const safeOrder = order === "asc" ? 1 : -1;

        const [tickets, total] = await Promise.all([
            populateTicket(
                Ticket.find(filter)
                    .sort({ [safeSortBy]: safeOrder })
                    .skip(skip)
                    .limit(limitNumber)
            ),
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
                department: isITManager(req.user)
                    ? req.user.department
                    : department || null,
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
        if (isAssetManagerBlocked(req.user)) {
            return deny(res, "Asset managers do not have ticket access");
        }

        if (isITManager(req.user) && !req.user.department) {
            return res.status(403).json({
                success: false,
                message:
                    "Your IT Manager account is not assigned to a department. Please contact a System Admin."
            });
        }

        const ticket = await populateTicket(Ticket.findById(req.params.id));

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to view this ticket");
        }

        const responseTicket = ticket.toObject();
        if (isEmployee(req.user)) {
            delete responseTicket.aiAnalysis;
            delete responseTicket.aiKnowledgeSuggestions;
        }

        res.status(200).json({
            success: true,
            ticket: responseTicket
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

        if (!canAccessTicket(req.user, existingTicket)) {
            return deny(res, "You are not authorized to update this ticket");
        }

        const staff =
            isSystemAdmin(req.user) ||
            isITManager(req.user) ||
            isTechnician(req.user);

        const updates = {};
        const allowedFields = staff
            ? ["title", "description", "category", "priority", "resolution"]
            : ["title", "description", "category"];

        if (
            req.body.department !== undefined &&
            (isSystemAdmin(req.user) || isITManager(req.user))
        ) {
            if (isITManager(req.user)) {
                updates.department = req.user.department;
            } else {
                updates.department = req.body.department;
            }
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (isEmployee(req.user)) {
            if (["resolved", "closed", "awaiting_manager_approval"].includes(existingTicket.status)) {
                if (req.body.title || req.body.description) {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot edit title or description on a resolved or closed ticket"
                    });
                }
            }
            if (req.body.priority || req.body.department || req.body.resolution) {
                return deny(
                    res,
                    "Employees are not permitted to modify priority, department, or resolution"
                );
            }
        }

        if (isTechnician(req.user) && req.body.department) {
            return deny(res, "Technicians cannot change ticket department");
        }

        const previousPriority = existingTicket.priority;
        if (updates.priority && updates.priority !== previousPriority) {
            const newSLA = await getSLAForPriority(updates.priority);
            if (newSLA) {
                const businessHours = await getBusinessHours();
                existingTicket.sla = newSLA._id;
                existingTicket.slaDueDate = calculateSLADueDate(
                    existingTicket.createdAt,
                    newSLA.resolutionTime,
                    businessHours
                );
                existingTicket.slaResponseDueDate = calculateResponseDueDate(
                    existingTicket.createdAt,
                    newSLA.responseTime,
                    businessHours
                );
            }
            await createAuditLog({
                ticket: existingTicket._id,
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "priority_changed",
                field: "priority",
                oldValue: previousPriority,
                newValue: updates.priority,
                description: `Priority changed from ${previousPriority} to ${updates.priority}`
            });
        }

        let requestedStatus = req.body.status;
        const previousStatus = existingTicket.status;

        if (requestedStatus !== undefined) {
            const effectiveStatus = resolveTechnicianStatus(
                req.user.role,
                requestedStatus
            );

            if (!isValidTransition(previousStatus, effectiveStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from ${previousStatus} to ${effectiveStatus}`
                });
            }

            if (
                !isRoleAllowedTransition(
                    req.user.role,
                    previousStatus,
                    requestedStatus === "resolved" && isTechnician(req.user)
                        ? "resolved"
                        : effectiveStatus
                ) &&
                !(
                    isTechnician(req.user) &&
                    requestedStatus === "resolved" &&
                    previousStatus === "in_progress"
                )
            ) {
                const techResolveOk =
                    isTechnician(req.user) &&
                    previousStatus === "in_progress" &&
                    requestedStatus === "resolved";

                if (!techResolveOk) {
                    return deny(
                        res,
                        `Your role cannot transition ticket from ${previousStatus} to ${requestedStatus}`
                    );
                }
            }

            if (isTechnician(req.user) && requestedStatus === "closed") {
                return deny(res, "Technicians cannot directly close tickets");
            }

            updates.status = effectiveStatus;

            if (
                (requestedStatus === "resolved" ||
                    effectiveStatus === "awaiting_manager_approval") &&
                previousStatus !== "resolved" &&
                previousStatus !== "awaiting_manager_approval"
            ) {
                existingTicket.resolvedAt = new Date();
                existingTicket.approvalStatus = "pending";
            }

            if (effectiveStatus === "reopened") {
                existingTicket.resolvedAt = null;
                existingTicket.approvalStatus = "none";
                existingTicket.approvedBy = null;
                existingTicket.approvedAt = null;
                existingTicket.approvalComment = null;
            }

            if (effectiveStatus === "closed") {
                existingTicket.approvalStatus =
                    existingTicket.approvalStatus === "pending"
                        ? "approved"
                        : existingTicket.approvalStatus;
                if (!existingTicket.approvedBy) {
                    existingTicket.approvedBy = req.user._id;
                }
                if (!existingTicket.approvedAt) {
                    existingTicket.approvedAt = new Date();
                }
            }
        }

        Object.assign(existingTicket, updates);

        const atRiskPercent = await getAtRiskThreshold();
        existingTicket.slaStatus = evaluateSLAStatus(existingTicket, {
            atRiskThresholdPercent: atRiskPercent
        });

        await existingTicket.save();

        if (
            requestedStatus !== undefined &&
            previousStatus !== existingTicket.status
        ) {
            let action = "status_changed";
            if (existingTicket.status === "awaiting_manager_approval") {
                action = "resolved";
            }
            if (existingTicket.status === "closed") action = "closed";
            if (existingTicket.status === "reopened") action = "reopened";

            await createAuditLog({
                ticket: existingTicket._id,
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action,
                field: "status",
                oldValue: previousStatus,
                newValue: existingTicket.status,
                description: `Ticket status changed from ${previousStatus} to ${existingTicket.status}`
            });

            if (!sameId(existingTicket.createdBy, req.user._id)) {
                await createNotification({
                    recipient: existingTicket.createdBy,
                    ticket: existingTicket._id,
                    type: "ticket_status_changed",
                    title: "Ticket Status Updated",
                    message: `Ticket ${existingTicket.ticketNumber} status has been updated to "${existingTicket.status}".`
                }).catch((err) => console.error("Notification error:", err.message));
            }

            if (
                existingTicket.assignedTo &&
                !sameId(existingTicket.assignedTo, req.user._id)
            ) {
                await createNotification({
                    recipient: existingTicket.assignedTo,
                    ticket: existingTicket._id,
                    type: "ticket_status_changed",
                    title: "Assigned Ticket Status Updated",
                    message: `Ticket ${existingTicket.ticketNumber} status changed to "${existingTicket.status}".`
                }).catch((err) => console.error("Notification error:", err.message));
            }

            if (existingTicket.status === "awaiting_manager_approval") {
                const managers = await getDepartmentManagers(
                    existingTicket.department
                );
                for (const manager of managers) {
                    await createNotification({
                        recipient: manager._id,
                        ticket: existingTicket._id,
                        type: "approval_required",
                        title: "Resolution Awaiting Approval",
                        message: `Ticket ${existingTicket.ticketNumber} is awaiting manager approval.`
                    }).catch((err) => console.error("Notification error:", err.message));
                }
            }
        }

        const populatedTicket = await populateTicket(
            Ticket.findById(existingTicket._id)
        );

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

        if (!technician.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign an inactive technician"
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        if (!canAccessTicket(req.user, ticket) && !isSystemAdmin(req.user)) {
            return deny(res, "You are not authorized to assign this ticket");
        }

        if (isITManager(req.user)) {
            if (
                !req.user.department ||
                !ticket.department ||
                !sameId(ticket.department, req.user.department)
            ) {
                return deny(
                    res,
                    "You can only assign tickets in your own department"
                );
            }
            if (
                !technician.department ||
                !sameId(technician.department, req.user.department)
            ) {
                return deny(
                    res,
                    "Technician must belong to your department"
                );
            }
        }

        const previousAssignee = ticket.assignedTo;

        ticket.assignedTo = technicianId;
        ticket.assignedBy = req.user._id;
        ticket.assignedAt = new Date();

        if (ticket.status === "open") {
            ticket.status = "assigned";
        }

        await ticket.save();

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: previousAssignee ? "reassigned" : "assigned",
            field: "assignedTo",
            oldValue: previousAssignee ? previousAssignee.toString() : null,
            newValue: technicianId.toString(),
            description: `Ticket assigned to ${technician.name}`,
            metadata: {
                previousTechnician: previousAssignee?.toString() || null,
                newTechnician: technicianId.toString(),
                assignedBy: req.user._id.toString()
            }
        });

        await createNotification({
            recipient: technician._id,
            ticket: ticket._id,
            type: "ticket_assigned",
            title: "New Ticket Assigned",
            message: `You have been assigned to ticket ${ticket.ticketNumber}: "${ticket.title}".`
        }).catch((err) => console.error("Notification error:", err.message));

        if (!sameId(ticket.createdBy, req.user._id)) {
            await createNotification({
                recipient: ticket.createdBy,
                ticket: ticket._id,
                type: "ticket_assigned",
                title: "Technician Assigned",
                message: `Technician ${technician.name} has been assigned to your ticket ${ticket.ticketNumber}.`
            }).catch((err) => console.error("Notification error:", err.message));
        }

        const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

        res.status(200).json({
            success: true,
            message: "Ticket assigned successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const approveTicket = async (req, res, next) => {
    try {
        if (!canApproveResolution(req.user)) {
            return deny(res, "Only IT Managers or System Admins can approve resolutions");
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to approve this ticket");
        }

        if (!isSystemAdmin(req.user) && sameId(ticket.assignedTo, req.user._id)) {
            return deny(res, "Technicians cannot approve their own resolution");
        }

        if (isITManager(req.user)) {
            if (!req.user.department || !ticket.department || !sameId(ticket.department, req.user.department)) {
                return deny(res, "You can only approve tickets in your own department");
            }
        }

        if (
            ticket.status !== "awaiting_manager_approval" &&
            ticket.status !== "resolved"
        ) {
            return res.status(400).json({
                success: false,
                message: "Ticket is not awaiting manager approval"
            });
        }

        const previousStatus = ticket.status;
        const comment = req.body.comment || req.body.approvalComment || "";

        ticket.status = "closed";
        ticket.approvalStatus = "approved";
        ticket.approvedBy = req.user._id;
        ticket.approvedAt = new Date();
        ticket.approvalComment = comment;

        await ticket.save();

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "approved",
            field: "status",
            oldValue: previousStatus,
            newValue: "closed",
            description: `Resolution approved${comment ? `: ${comment}` : ""}`,
            metadata: { approvalComment: comment }
        });

        await createNotification({
            recipient: ticket.createdBy,
            ticket: ticket._id,
            type: "ticket_status_changed",
            title: "Ticket Closed",
            message: `Ticket ${ticket.ticketNumber} has been approved and closed.`
        }).catch(() => {});

        if (ticket.assignedTo) {
            await createNotification({
                recipient: ticket.assignedTo,
                ticket: ticket._id,
                type: "ticket_status_changed",
                title: "Resolution Approved",
                message: `Your resolution for ticket ${ticket.ticketNumber} was approved.`
            }).catch(() => {});
        }

        const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

        res.status(200).json({
            success: true,
            message: "Resolution approved and ticket closed",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const rejectTicket = async (req, res, next) => {
    try {
        if (!canApproveResolution(req.user)) {
            return deny(res, "Only IT Managers or System Admins can reject resolutions");
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to reject this ticket");
        }

        if (!isSystemAdmin(req.user) && sameId(ticket.assignedTo, req.user._id)) {
            return deny(res, "Technicians cannot reject their own resolution");
        }

        if (isITManager(req.user)) {
            if (!req.user.department || !ticket.department || !sameId(ticket.department, req.user.department)) {
                return deny(res, "You can only reject tickets in your own department");
            }
        }

        if (
            ticket.status !== "awaiting_manager_approval" &&
            ticket.status !== "resolved"
        ) {
            return res.status(400).json({
                success: false,
                message: "Ticket is not awaiting manager approval"
            });
        }

        const previousStatus = ticket.status;
        const comment = req.body.comment || req.body.approvalComment || "";
        const reopenTo = req.body.reopenTo === "reopened" ? "reopened" : "in_progress";

        ticket.status = reopenTo;
        ticket.approvalStatus = "rejected";
        ticket.approvedBy = req.user._id;
        ticket.approvedAt = new Date();
        ticket.approvalComment = comment;
        ticket.resolvedAt = null;

        await ticket.save();

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "rejected",
            field: "status",
            oldValue: previousStatus,
            newValue: reopenTo,
            description: `Resolution rejected${comment ? `: ${comment}` : ""}`,
            metadata: { approvalComment: comment }
        });

        if (ticket.assignedTo) {
            await createNotification({
                recipient: ticket.assignedTo,
                ticket: ticket._id,
                type: "ticket_status_changed",
                title: "Resolution Rejected",
                message: `Resolution for ticket ${ticket.ticketNumber} was rejected. Status: ${reopenTo}.`
            }).catch(() => {});
        }

        await createNotification({
            recipient: ticket.createdBy,
            ticket: ticket._id,
            type: "ticket_status_changed",
            title: "Ticket Returned for Work",
            message: `Ticket ${ticket.ticketNumber} resolution was rejected and returned to ${reopenTo}.`
        }).catch(() => {});

        const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

        res.status(200).json({
            success: true,
            message: "Resolution rejected",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const escalateTicket = async (req, res, next) => {
    try {
        if (!isSystemAdmin(req.user) && !isITManager(req.user)) {
            return deny(res, "Only IT Managers or System Admins can escalate tickets");
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "You are not authorized to escalate this ticket");
        }

        const reason = (req.body.reason || req.body.escalationReason || "").trim();
        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Escalation reason is required"
            });
        }

        const previousSlaStatus = ticket.slaStatus;

        ticket.isEscalated = true;
        ticket.escalatedBy = req.user._id;
        ticket.escalatedAt = new Date();
        ticket.escalationReason = reason;
        ticket.slaStatus = "escalated";

        await ticket.save();

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "escalated",
            field: "slaStatus",
            oldValue: previousSlaStatus,
            newValue: "escalated",
            description: `Ticket escalated: ${reason}`,
            metadata: {
                escalatedBy: req.user._id.toString(),
                escalatedAt: ticket.escalatedAt,
                escalationReason: reason
            }
        });

        const managers = await getDepartmentManagers(ticket.department);
        for (const manager of managers) {
            if (sameId(manager._id, req.user._id)) continue;
            await createNotification({
                recipient: manager._id,
                ticket: ticket._id,
                type: "ticket_escalated",
                title: "Ticket Escalated",
                message: `Ticket ${ticket.ticketNumber} was escalated: ${reason}`
            }).catch(() => {});
        }

        if (ticket.assignedTo) {
            await createNotification({
                recipient: ticket.assignedTo,
                ticket: ticket._id,
                type: "ticket_escalated",
                title: "Assigned Ticket Escalated",
                message: `Ticket ${ticket.ticketNumber} was escalated: ${reason}`
            }).catch(() => {});
        }

        const populatedTicket = await populateTicket(Ticket.findById(ticket._id));

        res.status(200).json({
            success: true,
            message: "Ticket escalated successfully",
            ticket: populatedTicket
        });
    } catch (error) {
        next(error);
    }
};

export const uploadTicketAttachment = async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (!canAccessTicket(req.user, ticket)) {
            return deny(res, "Not authorized to attach files to this ticket");
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

        await createAuditLog({
            ticket: ticket._id,
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
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
