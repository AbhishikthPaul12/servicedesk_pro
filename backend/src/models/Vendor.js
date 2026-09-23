import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Vendor name is required"],
            trim: true,
            maxlength: 150
        },

        contactPerson: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        website: {
            type: String,
            trim: true,
            default: ""
        },

        category: {
            type: String,
            enum: ["hardware", "software", "network", "cloud", "services", "other"],
            default: "other"
        },

        contractStart: {
            type: Date,
            default: null
        },

        contractEnd: {
            type: Date,
            default: null
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
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

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
