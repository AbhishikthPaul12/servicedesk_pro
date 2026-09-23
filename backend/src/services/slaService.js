import SLA from "../models/SLA.js";

export const getSLAForPriority = async (priority) => {
    const sla = await SLA.findOne({
        priority,
        isActive: true
    });

    return sla;
};

export const calculateSLADueDate = (
    createdAt,
    resolutionTime
) => {
    const dueDate = new Date(createdAt);

    dueDate.setMinutes(
        dueDate.getMinutes() + resolutionTime
    );

    return dueDate;
};

export const evaluateSLAStatus = (ticket) => {
    if (!ticket.slaDueDate) {
        return "not_started";
    }

    const dueDate = new Date(ticket.slaDueDate);

    if (ticket.resolvedAt) {
        const resolvedAt = new Date(ticket.resolvedAt);

        return resolvedAt <= dueDate
            ? "met"
            : "breached";
    }

    return new Date() > dueDate
        ? "breached"
        : "active";
};