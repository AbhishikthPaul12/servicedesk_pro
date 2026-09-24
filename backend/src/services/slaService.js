import SLA from "../models/SLA.js";
import SystemConfig from "../models/SystemConfig.js";

const DEFAULT_BUSINESS_HOURS = {
    timezone: "UTC",
    workingDays: [1, 2, 3, 4, 5],
    startHour: 9,
    endHour: 17,
    holidays: []
};

const DEFAULT_AT_RISK_PERCENT = 80;

export const getSystemConfig = async () => {
    let config = await SystemConfig.findOne({ key: "default" });
    if (!config) {
        config = await SystemConfig.create({ key: "default" });
    }
    return config;
};

export const getSLAForPriority = async (priority) => {
    return SLA.findOne({
        priority,
        isActive: true
    });
};

export const addBusinessMinutes = (startDate, minutes, businessHours = DEFAULT_BUSINESS_HOURS) => {
    const workingDays = businessHours.workingDays?.length
        ? businessHours.workingDays
        : DEFAULT_BUSINESS_HOURS.workingDays;
    const startHour = businessHours.startHour ?? 9;
    const endHour = businessHours.endHour ?? 17;
    const holidays = new Set(businessHours.holidays || []);

    const minutesPerDay = (endHour - startHour) * 60;
    if (minutesPerDay <= 0 || minutes <= 0) {
        const fallback = new Date(startDate);
        fallback.setMinutes(fallback.getMinutes() + minutes);
        return fallback;
    }

    let remaining = minutes;
    const cursor = new Date(startDate);

    const advanceToWorkingWindow = (date) => {
        let d = new Date(date);
        for (let i = 0; i < 366; i++) {
            const day = d.getUTCDay();
            const ymd = d.toISOString().slice(0, 10);
            if (!workingDays.includes(day) || holidays.has(ymd)) {
                d.setUTCDate(d.getUTCDate() + 1);
                d.setUTCHours(startHour, 0, 0, 0);
                continue;
            }
            const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
            if (hour < startHour) {
                d.setUTCHours(startHour, 0, 0, 0);
                return d;
            }
            if (hour >= endHour) {
                d.setUTCDate(d.getUTCDate() + 1);
                d.setUTCHours(startHour, 0, 0, 0);
                continue;
            }
            return d;
        }
        return d;
    };

    let current = advanceToWorkingWindow(cursor);

    while (remaining > 0) {
        const endOfDay = new Date(current);
        endOfDay.setUTCHours(endHour, 0, 0, 0);

        const available = Math.max(
            0,
            Math.floor((endOfDay.getTime() - current.getTime()) / 60000)
        );

        if (available <= 0) {
            current.setUTCDate(current.getUTCDate() + 1);
            current.setUTCHours(startHour, 0, 0, 0);
            current = advanceToWorkingWindow(current);
            continue;
        }

        if (remaining <= available) {
            current = new Date(current.getTime() + remaining * 60000);
            remaining = 0;
        } else {
            remaining -= available;
            current.setUTCDate(current.getUTCDate() + 1);
            current.setUTCHours(startHour, 0, 0, 0);
            current = advanceToWorkingWindow(current);
        }
    }

    return current;
};

export const calculateSLADueDate = (createdAt, resolutionTime, businessHours = null) => {
    if (businessHours) {
        return addBusinessMinutes(createdAt, resolutionTime, businessHours);
    }
    const dueDate = new Date(createdAt);
    dueDate.setMinutes(dueDate.getMinutes() + resolutionTime);
    return dueDate;
};

export const calculateResponseDueDate = (createdAt, responseTime, businessHours = null) => {
    return calculateSLADueDate(createdAt, responseTime, businessHours);
};

export const evaluateSLAStatus = (ticket, options = {}) => {
    if (!ticket.slaDueDate) {
        return "not_started";
    }

    if (ticket.isEscalated && ticket.slaStatus === "escalated") {
    }

    const now = options.now ? new Date(options.now) : new Date();
    const dueDate = new Date(ticket.slaDueDate);
    const atRiskPercent = options.atRiskThresholdPercent ?? DEFAULT_AT_RISK_PERCENT;

    if (ticket.resolvedAt) {
        const resolvedAt = new Date(ticket.resolvedAt);
        return resolvedAt <= dueDate ? "met" : "breached";
    }

    if (now > dueDate) {
        return "breached";
    }

    const responseBreached =
        ticket.slaResponseDueDate &&
        !ticket.firstResponseAt &&
        now > new Date(ticket.slaResponseDueDate);

    const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
    if (createdAt) {
        const totalMs = dueDate.getTime() - createdAt.getTime();
        const elapsedMs = now.getTime() - createdAt.getTime();
        if (totalMs > 0) {
            const elapsedPercent = (elapsedMs / totalMs) * 100;
            if (elapsedPercent >= atRiskPercent || responseBreached) {
                return "at_risk";
            }
        }
    } else if (responseBreached) {
        return "at_risk";
    }

    if (ticket.isEscalated) {
        return "escalated";
    }

    return "active";
};

export const getAtRiskThreshold = async () => {
    const config = await getSystemConfig();
    return config.slaAtRiskThresholdPercent ?? DEFAULT_AT_RISK_PERCENT;
};

export const getBusinessHours = async () => {
    const config = await getSystemConfig();
    return config.businessHours || DEFAULT_BUSINESS_HOURS;
};

export { DEFAULT_BUSINESS_HOURS, DEFAULT_AT_RISK_PERCENT };
