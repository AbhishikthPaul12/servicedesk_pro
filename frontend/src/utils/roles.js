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

export const normalizeRole = (role) => {
  if (role === "admin") return "system_admin";
  if (role === "manager") return "it_manager";
  return role;
};

/** Role-aware ticket status transitions (mirrors backend UX only). */
export const getAllowedStatusOptions = (role, currentStatus) => {
  const r = normalizeRole(role);
  const map = {
    system_admin: {
      open: ["assigned", "in_progress"],
      assigned: ["in_progress"],
      in_progress: ["resolved"],
      resolved: ["awaiting_manager_approval", "closed", "reopened"],
      awaiting_manager_approval: ["closed", "reopened", "in_progress"],
      closed: ["reopened"],
      reopened: ["in_progress"]
    },
    it_manager: {
      open: ["assigned", "in_progress"],
      assigned: ["in_progress"],
      in_progress: ["resolved"],
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
    }
  };

  const options = map[r]?.[currentStatus] || [];
  return options;
};

export const STATUS_LABELS = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  awaiting_manager_approval: "Awaiting Manager Approval",
  closed: "Closed",
  reopened: "Reopened"
};
