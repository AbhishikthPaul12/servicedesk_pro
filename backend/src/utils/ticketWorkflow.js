const allowedTransitions = {
    open: ["assigned", "in_progress"],
    assigned: ["in_progress"],
    in_progress: ["resolved"],
    resolved: ["closed", "reopened"],
    closed: ["reopened"],
    reopened: ["in_progress"]
};

export const isValidTransition = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) {
        return true;
    }

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
};