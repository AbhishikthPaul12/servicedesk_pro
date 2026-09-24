import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";
import User from "../models/User.js";
import { isITManager, isSystemAdmin } from "../utils/roles.js";

export const buildDeptMatch = (user, extra = {}, requestedDepartment = null) => {
    const match = { ...extra };
    if (isITManager(user)) {
        if (!user.department) {
            match._id = null;
        } else {
            match.department = user.department;
        }
    } else if (isSystemAdmin(user) && requestedDepartment) {
        match.department = requestedDepartment;
    }
    return match;
};

export const getTicketReport = async ({ startDate, endDate, user, department }) => {
    const match = buildDeptMatch(user, {}, department);

    if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            match.createdAt.$lte = end;
        }
    }

    const [
        totalTickets,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        rawSlaBreakdown,
        escalations,
        reopened,
        pendingApprovals
    ] = await Promise.all([
        Ticket.countDocuments(match),
        Ticket.aggregate([
            { $match: match },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Ticket.aggregate([
            { $match: match },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Ticket.aggregate([
            { $match: match },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$slaStatus", null] },
                            "no_sla",
                            "$slaStatus"
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]),
        Ticket.countDocuments({ ...match, isEscalated: true }),
        Ticket.countDocuments({ ...match, status: "reopened" }),
        Ticket.countDocuments({
            ...match,
            status: "awaiting_manager_approval"
        })
    ]);

    const slaBreakdown = rawSlaBreakdown.map((item) => ({
        slaStatus: item._id || "no_sla",
        count: item.count
    }));

    const resolved = await Ticket.find({
        ...match,
        resolvedAt: { $ne: null }
    }).select("createdAt resolvedAt");

    let averageResolutionHours = null;
    if (resolved.length > 0) {
        const totalMs = resolved.reduce(
            (sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)),
            0
        );
        averageResolutionHours = Number(
            (totalMs / resolved.length / 3600000).toFixed(2)
        );
    }

    return {
        totalTickets,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        slaBreakdown,
        escalations,
        reopened,
        pendingApprovals,
        averageResolutionHours,
        scoped: isITManager(user)
    };
};

export const getAssetReport = async () => {
    const [totalAssets, statusBreakdown, typeBreakdown] = await Promise.all([
        Asset.countDocuments({ isArchived: { $ne: true } }),
        Asset.aggregate([
            { $match: { isArchived: { $ne: true } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Asset.aggregate([
            { $match: { isArchived: { $ne: true } } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
    ]);

    return {
        totalAssets,
        statusBreakdown,
        typeBreakdown
    };
};

export const getTechnicianReport = async (user) => {
    const techFilter = {
        role: "technician",
        isActive: true
    };

    if (isITManager(user)) {
        if (!user.department) {
            return [];
        }
        techFilter.department = user.department;
    }

    const technicians = await User.find(techFilter)
        .select("name email role department isActive")
        .populate("department", "name");

    const ticketDept =
        isITManager(user) && user.department
            ? { department: user.department }
            : {};

    const report = await Promise.all(
        technicians.map(async (tech) => {
            const [assigned, inProgress, resolved, closed, breached] =
                await Promise.all([
                    Ticket.countDocuments({
                        assignedTo: tech._id,
                        ...ticketDept
                    }),
                    Ticket.countDocuments({
                        assignedTo: tech._id,
                        status: "in_progress",
                        ...ticketDept
                    }),
                    Ticket.countDocuments({
                        assignedTo: tech._id,
                        status: { $in: ["resolved", "awaiting_manager_approval"] },
                        ...ticketDept
                    }),
                    Ticket.countDocuments({
                        assignedTo: tech._id,
                        status: "closed",
                        ...ticketDept
                    }),
                    Ticket.countDocuments({
                        assignedTo: tech._id,
                        slaStatus: "breached",
                        ...ticketDept
                    })
                ]);

            return {
                technician: {
                    id: tech._id,
                    name: tech.name,
                    email: tech.email,
                    role: tech.role,
                    department: tech.department ? tech.department.name : null,
                    isActive: tech.isActive
                },
                assigned,
                inProgress,
                resolved,
                closed,
                breached
            };
        })
    );

    return report;
};


