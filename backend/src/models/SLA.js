import mongoose from "mongoose";

const slaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "SLA name is required"],
            trim: true
        },

        priority: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            required: true,
            unique: true
        },

        responseTime: {
            type: Number,
            required: true,
            min: 1
        },

        resolutionTime: {
            type: Number,
            required: true,
            min: 1
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const SLA = mongoose.model("SLA", slaSchema);

export default SLA;