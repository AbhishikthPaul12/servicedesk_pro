import { isTechnician, isITManager, isSystemAdmin, sameId } from "../utils/roles.js";

/**
 * Record first technician/staff response timestamp for response-SLA tracking.
 */
export const maybeRecordFirstResponse = async (ticket, user) => {
    if (!ticket || ticket.firstResponseAt) return ticket;
    if (!isTechnician(user) && !isITManager(user) && !isSystemAdmin(user)) {
        return ticket;
    }
    if (sameId(ticket.createdBy, user._id)) return ticket;

    ticket.firstResponseAt = new Date();
    await ticket.save();
    return ticket;
};
