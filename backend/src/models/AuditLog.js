import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: false,
            default: null
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },

        actorRole: {
            type: String,
            default: null
        },

        isSystemAction: {
            type: Boolean,
            default: false
        },

        action: {
            type: String,
            required: true
        },

        entity: {
            type: String,
            default: "ticket"
        },

        entityId: {
            type: mongoose.Schema.Types.Mixed,
            default: null
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
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

auditLogSchema.index({ ticket: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
