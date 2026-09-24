import mongoose from "mongoose";

/**
 * Valid asset lifecycle transitions.
 * Retired → Available is NOT a normal transition (use explicit reactivation).
 */
export const ASSET_TRANSITIONS = {
    procurement: ["available", "retired"],
    available: ["assigned", "maintenance", "retired"],
    assigned: ["available", "maintenance", "retired"],
    maintenance: ["available", "retired"],
    retired: []
};

export const isValidAssetTransition = (current, next) => {
    if (current === next) return true;
    return ASSET_TRANSITIONS[current]?.includes(next) || false;
};

export const canReactivateAsset = (userRole) => {
    return ["system_admin", "admin", "asset_manager"].includes(userRole);
};
