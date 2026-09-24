import mongoose from "mongoose";

const assignmentHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        returnedAt: {
            type: Date,
            default: null
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { _id: false }
);

const assetSchema = new mongoose.Schema(
    {
        assetTag: {
            type: String,
            required: [true, "Asset tag is required"],
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: [true, "Asset name is required"],
            trim: true,
            maxlength: 100
        },

        type: {
            type: String,
            enum: [
                "laptop",
                "desktop",
                "monitor",
                "printer",
                "mobile",
                "tablet",
                "network_device",
                "other"
            ],
            required: true
        },

        brand: {
            type: String,
            trim: true,
            default: ""
        },

        model: {
            type: String,
            trim: true,
            default: ""
        },

        serialNumber: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },

        status: {
            type: String,
            enum: [
                "procurement",
                "available",
                "assigned",
                "maintenance",
                "retired"
            ],
            default: "available"
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        purchaseDate: {
            type: Date,
            default: null
        },

        warrantyExpiry: {
            type: Date,
            default: null
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            default: null
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        assignmentHistory: {
            type: [assignmentHistorySchema],
            default: []
        },

        isArchived: {
            type: Boolean,
            default: false
        },

        archivedAt: {
            type: Date,
            default: null
        },

        archivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

assetSchema.index({ status: 1, type: 1 });
assetSchema.index({ assignedTo: 1 });
assetSchema.index({ isArchived: 1 });

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
