import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            default: "default"
        },

        businessHours: {
            timezone: {
                type: String,
                default: "UTC"
            },
            workingDays: {
                type: [Number],
                default: [1, 2, 3, 4, 5]
            },
            startHour: {
                type: Number,
                default: 9,
                min: 0,
                max: 23
            },
            endHour: {
                type: Number,
                default: 17,
                min: 1,
                max: 24
            },
            holidays: {
                type: [String],
                default: []
            }
        },

        slaAtRiskThresholdPercent: {
            type: Number,
            default: 80,
            min: 1,
            max: 99
        },

        notificationSettings: {
            slaAtRisk: { type: Boolean, default: true },
            slaBreach: { type: Boolean, default: true },
            escalation: { type: Boolean, default: true },
            approval: { type: Boolean, default: true }
        },

        allowedTicketCategories: {
            type: [String],
            default: [
                "hardware",
                "software",
                "network",
                "access",
                "security",
                "other"
            ]
        }
    },
    {
        timestamps: true
    }
);

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);

export default SystemConfig;
