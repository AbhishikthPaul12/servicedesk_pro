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
            required: true
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
                "reopened"
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

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;