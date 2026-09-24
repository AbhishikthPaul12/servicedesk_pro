import { normalizeRole, isSystemAdmin, isITManager, isTechnician, isEmployee } from "./roles.js";

const allowedTransitions = {
    open: ["assigned", "in_progress"],
    assigned: ["in_progress"],
    in_progress: ["resolved", "awaiting_manager_approval"],
    resolved: ["awaiting_manager_approval", "closed", "reopened"],
    awaiting_manager_approval: ["closed", "reopened", "in_progress"],
    closed: ["reopened"],
    reopened: ["in_progress"]
};

const roleTransitions = {
    system_admin: {
        open: ["assigned", "in_progress"],
        assigned: ["in_progress"],
        in_progress: ["resolved", "awaiting_manager_approval"],
        resolved: ["awaiting_manager_approval", "closed", "reopened"],
        awaiting_manager_approval: ["closed", "reopened", "in_progress"],
        closed: ["reopened"],
        reopened: ["in_progress"]
    },
    it_manager: {
        open: ["assigned", "in_progress"],
        assigned: ["in_progress"],
        in_progress: ["resolved", "awaiting_manager_approval"],
        resolved: ["awaiting_manager_approval", "closed", "reopened"],
        awaiting_manager_approval: ["closed", "reopened", "in_progress"],
        closed: ["reopened"],
        reopened: ["in_progress"]
    },
    technician: {
        open: ["assigned", "in_progress"],
        assigned: ["in_progress"],
        in_progress: ["resolved"],
        resolved: [],
        awaiting_manager_approval: [],
        closed: [],
        reopened: ["in_progress"]
    },
    employee: {
        open: [],
        assigned: [],
        in_progress: [],
        resolved: ["closed", "reopened"],
        awaiting_manager_approval: ["closed", "reopened"],
        closed: ["reopened"],
        reopened: []
    },
    asset_manager: {}
};

export const TICKET_STATUSES = [
    "open",
    "assigned",
    "in_progress",
    "resolved",
    "awaiting_manager_approval",
    "closed",
    "reopened"
];

export const isValidTransition = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) {
        return true;
    }

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};

export const getAllowedTransitionsForRole = (role, currentStatus) => {
    const normalized = normalizeRole(role);
    const map = roleTransitions[normalized] || {};
    return map[currentStatus] || [];
};

export const isRoleAllowedTransition = (role, currentStatus, newStatus) => {
    if (currentStatus === newStatus) return true;
    if (!isValidTransition(currentStatus, newStatus)) return false;

    const allowed = getAllowedTransitionsForRole(role, currentStatus);
    return allowed.includes(newStatus);
};

export const resolveTechnicianStatus = (role, requestedStatus) => {
    if (
        (isTechnician(role) || normalizeRole(role) === "technician") &&
        requestedStatus === "resolved"
    ) {
        return "awaiting_manager_approval";
    }
    return requestedStatus;
};

export const canApproveResolution = (user) =>
    isSystemAdmin(user) || isITManager(user);

export const canConfirmResolution = (user) => isEmployee(user);

export const canEscalateTicket = (user) =>
    isSystemAdmin(user) || isITManager(user);

export { allowedTransitions, roleTransitions };
