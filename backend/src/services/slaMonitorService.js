import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createAuditLog } from "./auditService.js";
import { evaluateSLAStatus, getAtRiskThreshold } from "./slaService.js";
import { normalizeRole } from "../utils/roles.js";

/**
 * Notify IT managers for a department (canonical role: it_manager).
 * Also includes legacy "manager" for backward compatibility.
 */
const getDepartmentManagers = async (departmentId) => {
    // Never broadcast to all managers when ticket.department is null
    if (!departmentId) {
        return [];
    }
    return User.find({
        role: { $in: ["it_manager", "manager"] },
        isActive: true,
        department: departmentId
    });
};

export const checkSLABreaches = async () => {
    try {
        const now = new Date();
        const atRiskPercent = await getAtRiskThreshold();

        const openTickets = await Ticket.find({
            slaStatus: { $in: ["active", "at_risk", "not_started"] },
            slaDueDate: { $ne: null },
            status: {
                $nin: ["resolved", "closed", "awaiting_manager_approval"]
            }
        });

        if (openTickets.length === 0) {
            return;
        }

        let breachedCount = 0;
        let atRiskCount = 0;

        for (const ticket of openTickets) {
            const previousStatus = ticket.slaStatus;
            const newStatus = evaluateSLAStatus(ticket, {
                now,
                atRiskThresholdPercent: atRiskPercent
            });

            if (newStatus === previousStatus) {
                continue;
            }

            // Do not downgrade from breached
            if (previousStatus === "breached" && newStatus !== "met") {
                continue;
            }

            ticket.slaStatus = newStatus;
            await ticket.save();

            if (newStatus === "breached" && previousStatus !== "breached") {
                breachedCount += 1;

                await createAuditLog({
                    ticket: ticket._id,
                    isSystemAction: true,
                    action: "sla_breached",
                    field: "slaStatus",
                    oldValue: previousStatus,
                    newValue: "breached",
                    description: `Automated SLA breach detected for ticket ${ticket.ticketNumber}`
                });

                const managers = await getDepartmentManagers(ticket.department);
                for (const manager of managers) {
                    await Notification.create({
                        recipient: manager._id,
                        ticket: ticket._id,
                        type: "sla_breached",
                        title: "SLA Breached",
                        message: `Ticket ${ticket.ticketNumber} has breached its SLA.`
                    });
                }

                if (ticket.assignedTo) {
                    await Notification.create({
                        recipient: ticket.assignedTo,
                        ticket: ticket._id,
                        type: "sla_breached",
                        title: "Assigned Ticket SLA Breached",
                        message: `Ticket ${ticket.ticketNumber} has breached its SLA.`
                    });
                }
            }

            if (newStatus === "at_risk" && previousStatus === "active") {
                atRiskCount += 1;

                await createAuditLog({
                    ticket: ticket._id,
                    isSystemAction: true,
                    action: "sla_at_risk",
                    field: "slaStatus",
                    oldValue: previousStatus,
                    newValue: "at_risk",
                    description: `Ticket ${ticket.ticketNumber} is at risk of SLA breach`
                });

                const managers = await getDepartmentManagers(ticket.department);
                for (const manager of managers) {
                    await Notification.create({
                        recipient: manager._id,
                        ticket: ticket._id,
                        type: "sla_at_risk",
                        title: "SLA At Risk",
                        message: `Ticket ${ticket.ticketNumber} is approaching its SLA deadline.`
                    });
                }
            }
        }

        if (breachedCount || atRiskCount) {
            console.log(
                `SLA Monitor: ${breachedCount} breached, ${atRiskCount} at-risk`
            );
        }
    } catch (error) {
        console.error(`SLA Monitor Error: ${error.message}`);
    }
};

export { getDepartmentManagers, normalizeRole };
