import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

export const checkSLABreaches = async () => {
    try {
        const now = new Date();

        const overdueTickets = await Ticket.find({
            slaStatus: "active",
            slaDueDate: {
                $lt: now
            },
            status: {
                $nin: ["resolved", "closed"]
            }
        });

        if (overdueTickets.length === 0) {
            return;
        }

        const managers = await User.find({
            role: {
                $in: ["admin", "manager"]
            },
            isActive: true
        });

        for (const ticket of overdueTickets) {
            ticket.slaStatus = "breached";

            await ticket.save();

            await AuditLog.create({
                ticket: ticket._id,
                user: null,
                isSystemAction: true,
                action: "sla_breached",
                field: "slaStatus",
                oldValue: "active",
                newValue: "breached",
                description: `Automated SLA breach detected for ticket ${ticket.ticketNumber}`
            });

            for (const manager of managers) {
                await Notification.create({
                    recipient: manager._id,
                    ticket: ticket._id,
                    type: "sla_breached",
                    title: "SLA Breached",
                    message: `Ticket ${ticket.ticketNumber} has breached its SLA.`
                });
            }
        }

        console.log(
            `SLA Monitor: ${overdueTickets.length} ticket(s) breached`
        );
    } catch (error) {
        console.error(
            `SLA Monitor Error: ${error.message}`
        );
    }
};