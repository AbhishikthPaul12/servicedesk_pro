import Ticket from "../models/Ticket.js";
import Asset from "../models/Asset.js";
import User from "../models/User.js";

export const getOverviewStats = async () => {
    const [
        ticketStats,
        slaStats,
        assetStats
    ] = await Promise.all([
        Ticket.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]),

        Ticket.aggregate([
            {
                $group: {
                    _id: "$slaStatus",
                    count: { $sum: 1 }
                }
            }
        ]),

        Asset.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    const tickets = {
        total: 0,
        open: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        reopened: 0
    };

    for (const item of ticketStats) {
        if (tickets[item._id] !== undefined) {
            tickets[item._id] = item.count;
        }

        tickets.total += item.count;
    }

    const sla = {
        active: 0,
        met: 0,
        breached: 0,
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

    const assets = {
        total: 0,
        available: 0,
        assigned: 0,
        maintenance: 0,
        retired: 0
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
        assets
    };
};


export const getTicketAnalytics = async () => {
    const [
        byStatus,
        byPriority,
        byCategory
    ] = await Promise.all([
        Ticket.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]),

        Ticket.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]),

        Ticket.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ])
    ]);

    return {
        byStatus,
        byPriority,
        byCategory
    };
};


export const getTechnicianWorkload = async () => {
    const technicians = await User.find({
        role: "technician",
        isActive: true
    }).select("name email");

    const workload = await Promise.all(
        technicians.map(async (technician) => {
            const stats = await Ticket.aggregate([
                {
                    $match: {
                        assignedTo: technician._id
                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
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
                closed: 0,
                reopened: 0,
                breached: 0
            };

            for (const item of stats) {
                if (result[item._id] !== undefined) {
                    result[item._id] = item.count;
                }

                result.total += item.count;
            }

            const breached = await Ticket.countDocuments({
                assignedTo: technician._id,
                slaStatus: "breached"
            });

            result.breached = breached;

            return result;
        })
    );

    return workload;
};


export const getAssetAnalytics = async () => {
    const stats = await Asset.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    return stats;
};