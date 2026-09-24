import AuditLog from "../models/AuditLog.js";

/**
 * Create an audit log entry.
 * Use actor: null + isSystemAction: true for SYSTEM-generated events.
 */
export const createAuditLog = async ({
    ticket = null,
    user = null,
    actorRole = null,
    isSystemAction = false,
    action,
    entity = "ticket",
    entityId = null,
    field = null,
    oldValue = null,
    newValue = null,
    description = "",
    metadata = {}
}) => {
    try {
        return await AuditLog.create({
            ticket,
            user: isSystemAction ? null : user,
            actorRole: isSystemAction ? "SYSTEM" : actorRole,
            isSystemAction,
            action,
            entity,
            entityId: entityId || ticket || null,
            field,
            oldValue: oldValue != null ? String(oldValue) : null,
            newValue: newValue != null ? String(newValue) : null,
            description,
            metadata
        });
    } catch (error) {
        console.error("Audit log error:", error.message);
        return null;
    }
};
