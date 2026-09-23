import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            default: null
        },

        type: {
            type: String,
            enum: [
                "ticket_assigned",
                "ticket_status_changed",
                "sla_breached",
                "ticket_commented",
                "system"
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;