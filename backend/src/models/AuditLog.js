import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        isSystemAction: {
            type: Boolean,
            default: false
        },

        action: {
            type: String,
            required: true,
            enum: [
                "created",
                "updated",
                "assigned",
                "status_changed",
                "commented",
                "resolved",
                "closed",
                "reopened",
                "escalated",
                "sla_breached"
            ]
        },

        field: {
            type: String,
            default: null
        },

        oldValue: {
            type: String,
            default: null
        },

        newValue: {
            type: String,
            default: null
        },

        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

auditLogSchema.index({ ticket: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;