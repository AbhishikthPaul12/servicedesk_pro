import {
    isSystemAdmin,
    isITManager,
    isTechnician,
    isEmployee,
    isAssetManager,
    sameId,
    getId,
    normalizeRole
} from "./roles.js";

export const buildTicketAccessFilter = (user) => {
    if (isSystemAdmin(user)) {
        return {};
    }

    if (isITManager(user)) {
        if (!user.department) {
            return { _id: null };
        }
        return { department: user.department };
    }

    if (isTechnician(user)) {
        return {
            $or: [
                { assignedTo: user._id },
                { authorizedTechnicians: user._id },
                { createdBy: user._id }
            ]
        };
    }

    if (isEmployee(user)) {
        return { createdBy: user._id };
    }

    if (isAssetManager(user)) {
        return { _id: null };
    }

    return { _id: null };
};

export const canAccessTicket = (user, ticket) => {
    if (!user || !ticket) return false;
    if (isSystemAdmin(user)) return true;

    const isCreator = sameId(ticket.createdBy, user._id);
    const isAssigned = sameId(ticket.assignedTo, user._id);
    const isAuthorized =
        Array.isArray(ticket.authorizedTechnicians) &&
        ticket.authorizedTechnicians.some((id) => sameId(id, user._id));
    const sameDept =
        user.department &&
        ticket.department &&
        sameId(ticket.department, user.department);

    if (isITManager(user)) {
        if (!user.department) return false;
        return Boolean(sameDept);
    }

    if (isTechnician(user)) {
        return isAssigned || isAuthorized || isCreator;
    }

    if (isEmployee(user)) {
        return isCreator;
    }

    if (isAssetManager(user)) {
        return false;
    }

    return false;
};

export const canModifyTicket = (user, ticket) => canAccessTicket(user, ticket);

export const canAssignTicket = (user, ticket) => {
    if (!canAccessTicket(user, ticket)) return false;
    return isSystemAdmin(user) || isITManager(user);
};

export const canCreateWorkLog = (user, ticket) => {
    if (isSystemAdmin(user)) return true;
    if (!isTechnician(user)) return false;
    return (
        sameId(ticket.assignedTo, user._id) ||
        (Array.isArray(ticket.authorizedTechnicians) &&
            ticket.authorizedTechnicians.some((id) => sameId(id, user._id)))
    );
};

export const canViewWorkLogs = (user, ticket) => {
    if (isEmployee(user) || isAssetManager(user)) return false;
    return canAccessTicket(user, ticket);
};

export const canCreateWorkLogAsManager = () => false;

export const canDeleteWorkLog = (user, workLog) => {
    if (isSystemAdmin(user)) return true;
    if (isITManager(user)) return false;
    return sameId(workLog.technician, user._id);
};

export const canUseTicketAI = (user, ticket) => {
    if (isEmployee(user) || isAssetManager(user)) return false;
    return canAccessTicket(user, ticket);
};

export const canManageAssets = (user) =>
    isSystemAdmin(user) || isAssetManager(user);

export const canViewAssets = (user) =>
    isSystemAdmin(user) ||
    isAssetManager(user) ||
    isITManager(user) ||
    isTechnician(user);

export const canMutateAssets = (user) => canManageAssets(user);

export const canTechnicianUpdateAssetOps = (user) => isTechnician(user);

export const deny = (res, message = "You are not authorized to perform this action", status = 403) =>
    res.status(status).json({ success: false, message });

export const applyDepartmentScope = (user, filter, requestedDepartment) => {
    if (isSystemAdmin(user)) {
        if (requestedDepartment) {
            filter.department = requestedDepartment;
        }
        return filter;
    }

    if (isITManager(user)) {
        if (user.department) {
            filter.department = user.department;
        }
        return filter;
    }

    if (requestedDepartment && !isTechnician(user) && !isEmployee(user)) {
        filter.department = requestedDepartment;
    }

    return filter;
};

export const getUserDepartmentId = (user) => getId(user?.department);

export { normalizeRole, getId, sameId };
