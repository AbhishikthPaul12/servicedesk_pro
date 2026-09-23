import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: [true, "Ticket ID is required"]
        },

        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Technician ID is required"]
        },

        description: {
            type: String,
            required: [true, "Work log description is required"],
            trim: true,
            minlength: 2,
            maxlength: 2000
        },

        timeSpent: {
            type: Number,
            required: [true, "Time spent (in minutes) is required"],
            min: [1, "Time spent must be at least 1 minute"]
        }
    },
    {
        timestamps: true
    }
);

workLogSchema.index({ ticket: 1, createdAt: -1 });

const WorkLog = mongoose.model("WorkLog", workLogSchema);

export default WorkLog;
