
export const ROLES = {
    SYSTEM_ADMIN: "system_admin",
    IT_MANAGER: "it_manager",
    TECHNICIAN: "technician",
    EMPLOYEE: "employee",
    ASSET_MANAGER: "asset_manager"
};

export const normalizeRole = (role) => {
    if (role === "admin") return ROLES.SYSTEM_ADMIN;
    if (role === "manager") return ROLES.IT_MANAGER;
    return role;
};

export const isSystemAdmin = (userOrRole) => {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return normalizeRole(role) === ROLES.SYSTEM_ADMIN;
};

export const isITManager = (userOrRole) => {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return normalizeRole(role) === ROLES.IT_MANAGER;
};

export const isTechnician = (userOrRole) => {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return normalizeRole(role) === ROLES.TECHNICIAN;
};

export const isEmployee = (userOrRole) => {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return normalizeRole(role) === ROLES.EMPLOYEE;
};

export const isAssetManager = (userOrRole) => {
    const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
    return normalizeRole(role) === ROLES.ASSET_MANAGER;
};

export const isInternalStaff = (userOrRole) => {
    const role = normalizeRole(
        typeof userOrRole === "string" ? userOrRole : userOrRole?.role
    );
    return [
        ROLES.SYSTEM_ADMIN,
        ROLES.IT_MANAGER,
        ROLES.TECHNICIAN
    ].includes(role);
};

export const canSeeInternalNotes = (userOrRole) => isInternalStaff(userOrRole);

export const getId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (value._id) return value._id.toString();
    return value.toString();
};

export const sameId = (a, b) => {
    const idA = getId(a);
    const idB = getId(b);
    if (!idA || !idB) return false;
    return idA === idB;
};

export const ROLE_LABELS = {
    system_admin: "System Admin",
    admin: "System Admin",
    it_manager: "IT Manager",
    manager: "IT Manager",
    technician: "Technician",
    employee: "Employee",
    asset_manager: "Asset Manager"
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;
