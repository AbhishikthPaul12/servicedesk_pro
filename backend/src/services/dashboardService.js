import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";
import User from "../models/User.js";
import { isITManager, isSystemAdmin, getId } from "../utils/roles.js";

const deptMatch = (user) => {
    if (isSystemAdmin(user)) return {};
    if (isITManager(user) && user.department) {
        return { department: user.department };
    }
    if (isITManager(user) && !user.department) {
        return { _id: null };
    }
    return {};
};

export const getOverviewStats = async (user) => {
    const match = deptMatch(user);

    const [ticketStats, slaStats, assetStats, pendingApprovals, escalatedCount, unassigned] =
        await Promise.all([
            Ticket.aggregate([
                { $match: match },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Ticket.aggregate([
                { $match: match },
                { $group: { _id: "$slaStatus", count: { $sum: 1 } } }
            ]),
            isSystemAdmin(user) || isITManager(user)
                ? Asset.aggregate([
                      { $match: { isArchived: { $ne: true } } },
                      { $group: { _id: "$status", count: { $sum: 1 } } }
                  ])
                : Promise.resolve([]),
            Ticket.countDocuments({
                ...match,
                status: "awaiting_manager_approval"
            }),
            Ticket.countDocuments({ ...match, isEscalated: true }),
            Ticket.countDocuments({
                ...match,
                assignedTo: null,
                status: { $nin: ["closed"] }
            })
        ]);

    const tickets = {
        total: 0,
        open: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        awaiting_manager_approval: 0,
        closed: 0,
        reopened: 0,
        unassigned,
        pendingApprovals,
        escalated: escalatedCount
    };

    for (const item of ticketStats) {
        if (tickets[item._id] !== undefined) {
            tickets[item._id] = item.count;
        }
        tickets.total += item.count;
    }

    const sla = {
        active: 0,
        at_risk: 0,
        met: 0,
        breached: 0,
        escalated: 0,
        compliancePercentage: 0
    };

    for (const item of slaStats) {
        if (sla[item._id] !== undefined) {
            sla[item._id] = item.count;
        }
    }

    const completedSLA = sla.met + sla.breached;
    if (completedSLA > 0) {
        sla.compliancePercentage = Number(
            ((sla.met / completedSLA) * 100).toFixed(2)
        );
    }

    const critical = await Ticket.countDocuments({
        ...match,
        priority: "critical",
        status: { $nin: ["closed"] }
    });
    const high = await Ticket.countDocuments({
        ...match,
        priority: "high",
        status: { $nin: ["closed"] }
    });

    tickets.critical = critical;
    tickets.high = high;

    const assets = {
        total: 0,
        available: 0,
        assigned: 0,
        maintenance: 0,
        retired: 0,
        procurement: 0
    };

    for (const item of assetStats) {
        if (assets[item._id] !== undefined) {
            assets[item._id] = item.count;
        }
        assets.total += item.count;
    }

    return {
        tickets,
        sla,
        assets,
        scoped: isITManager(user),
        departmentId: getId(user.department)
    };
};

export const getTicketAnalytics = async (user) => {
    const match = deptMatch(user);

    const [byStatus, byPriority, byCategory] = await Promise.all([
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
        ])
    ]);

    return { byStatus, byPriority, byCategory };
};

export const getTechnicianWorkload = async (user) => {
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

    const technicians = await User.find(techFilter).select(
        "name email department"
    );

    const ticketDeptFilter =
        isITManager(user) && user.department
            ? { department: user.department }
            : {};

    const workload = await Promise.all(
        technicians.map(async (technician) => {
            const stats = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: technician._id,
                        ...ticketDeptFilter
                    }
                },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);

            const result = {
                technicianId: technician._id,
                name: technician.name,
                email: technician.email,
                total: 0,
                open: 0,
                assigned: 0,
                in_progress: 0,
                resolved: 0,
                awaiting_manager_approval: 0,
                closed: 0,
                reopened: 0,
                breached: 0,
                avgResolutionHours: null
            };

            for (const item of stats) {
                if (result[item._id] !== undefined) {
                    result[item._id] = item.count;
                }
                result.total += item.count;
            }

            result.breached = await Ticket.countDocuments({
                assignedTo: technician._id,
                slaStatus: "breached",
                ...ticketDeptFilter
            });

            const resolvedTickets = await Ticket.find({
                assignedTo: technician._id,
                resolvedAt: { $ne: null },
                ...ticketDeptFilter
            }).select("createdAt resolvedAt");

            if (resolvedTickets.length > 0) {
                const totalMs = resolvedTickets.reduce((sum, t) => {
                    return (
                        sum +
                        (new Date(t.resolvedAt) - new Date(t.createdAt))
                    );
                }, 0);
                result.avgResolutionHours = Number(
                    (totalMs / resolvedTickets.length / 3600000).toFixed(2)
                );
            }

            return result;
        })
    );

    return workload;
};

export const getAssetAnalytics = async () => {
    return Asset.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};
