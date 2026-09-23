import Vendor from "../models/Vendor.js";

export const getVendors = async (req, res, next) => {
    try {
        const { category, isActive, keyword, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (isActive !== undefined) filter.isActive = isActive === "true";
        if (keyword) {
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { contactPerson: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } }
            ];
        }
        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.min(parseInt(limit) || 20, 100);
        const skip = (pageNum - 1) * limitNum;

        const [vendors, total] = await Promise.all([
            Vendor.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
            Vendor.countDocuments(filter)
        ]);
        res.status(200).json({ success: true, data: vendors, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (error) {
        next(error);
    }
};

export const getVendorById = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        next(error);
    }
};

export const createVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor.create(req.body);
        res.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
    } catch (error) {
        next(error);
    }
};

export const updateVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
        res.status(200).json({ success: true, message: "Vendor updated successfully", data: vendor });
    } catch (error) {
        next(error);
    }
};

export const deleteVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
        res.status(200).json({ success: true, message: "Vendor deleted successfully" });
    } catch (error) {
        next(error);
    }
};
