import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";
import User from "../models/User.js";

export const getTicketReport = async ({
    startDate,
    endDate
}) => {
    const match = {};

    if (startDate || endDate) {
        match.createdAt = {};

        if (startDate) {
            match.createdAt.$gte = new Date(startDate);
        }

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
        rawSlaBreakdown
    ] = await Promise.all([
        Ticket.countDocuments(match),

        Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]),

        Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]),

        Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
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
        ])
    ]);

    const slaBreakdown = rawSlaBreakdown.map((item) => ({
        slaStatus: item._id || "no_sla",
        count: item.count
    }));

    return {
        totalTickets,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        slaBreakdown
    };
};

export const getAssetReport = async () => {
    const [
        totalAssets,
        statusBreakdown,
        typeBreakdown
    ] = await Promise.all([
        Asset.countDocuments(),

        Asset.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]),

        Asset.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ])
    ]);

    return {
        totalAssets,
        statusBreakdown,
        typeBreakdown
    };
};

export const getTechnicianReport = async () => {
    const technicians = await User.find({
        role: { $in: ["technician", "it_manager", "manager", "system_admin", "admin"] }
    })
        .select("name email role department")
        .populate("department", "name");

    const report = await Promise.all(
        technicians.map(async (tech) => {
            const [assigned, inProgress, resolved, closed] = await Promise.all([
                Ticket.countDocuments({ assignedTo: tech._id }),
                Ticket.countDocuments({ assignedTo: tech._id, status: "in_progress" }),
                Ticket.countDocuments({ assignedTo: tech._id, status: "resolved" }),
                Ticket.countDocuments({ assignedTo: tech._id, status: "closed" })
            ]);

            return {
                technician: {
                    id: tech._id,
                    name: tech.name,
                    email: tech.email,
                    role: tech.role,
                    department: tech.department ? tech.department.name : null
                },
                assigned,
                inProgress,
                resolved,
                closed
            };
        })
    );

    return report;
};