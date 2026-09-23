import mongoose from "mongoose";

const savedFilterSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        name: {
            type: String,
            required: [true, "Filter name is required"],
            trim: true,
            maxlength: 100
        },

        filters: {
            status: String,
            priority: String,
            category: String,
            assignedTo: String,
            department: String,
            slaStatus: String,
            keyword: String,
            startDate: String,
            endDate: String,
            sortBy: String,
            order: String
        }
    },
    {
        timestamps: true
    }
);

savedFilterSchema.index({ user: 1, createdAt: -1 });

const SavedFilter = mongoose.model("SavedFilter", savedFilterSchema);

export default SavedFilter;
