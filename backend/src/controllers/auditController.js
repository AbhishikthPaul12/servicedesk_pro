import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res, next) => {
    try {
        const {
            actor,
            role,
            entity,
            action,
            ticket,
            user,
            asset,
            startDate,
            endDate,
            page = 1,
            limit = 25
        } = req.query;

        const filter = {};

        if (actor) filter.user = actor;
        if (role) filter.actorRole = role;
        if (entity) filter.entity = entity;
        if (action) filter.action = action;
        if (ticket) filter.ticket = ticket;
        if (user) {
            filter.$or = [{ user }, { entityId: user, entity: "user" }];
        }
        if (asset) {
            filter.entity = "asset";
            filter.entityId = asset;
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
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .populate("user", "name email role")
                .populate("ticket", "ticketNumber title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            AuditLog.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            logs
        });
    } catch (error) {
        next(error);
    }
};
