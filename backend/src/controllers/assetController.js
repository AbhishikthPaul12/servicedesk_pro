import Asset from "../models/Asset.js";
import User from "../models/User.js";

export const createAsset = async (req, res, next) => {
    try {
        const asset = await Asset.create(req.body);

        const populatedAsset = await Asset.findById(asset._id)
            .populate("assignedTo", "name email role");

        res.status(201).json({
            success: true,
            message: "Asset created successfully",
            asset: populatedAsset
        });
    } catch (error) {
        next(error);
    }
};

export const getAssets = async (req, res, next) => {
    try {
        const {
            status,
            type,
            assignedTo,
            keyword,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (type) {
            filter.type = type;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        if (keyword) {
            filter.$or = [
                { assetTag: { $regex: keyword, $options: "i" } },
                { name: { $regex: keyword, $options: "i" } },
                { brand: { $regex: keyword, $options: "i" } },
                { model: { $regex: keyword, $options: "i" } },
                { serialNumber: { $regex: keyword, $options: "i" } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                filter.createdAt.$lte = end;
            }
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);

        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );

        const skip = (pageNumber - 1) * limitNumber;

        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "name",
            "assetTag",
            "purchaseDate",
            "warrantyExpiry",
            "status"
        ];

        const safeSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";

        const safeOrder = order === "asc" ? 1 : -1;

        const [assets, total] = await Promise.all([
            Asset.find(filter)
                .populate("assignedTo", "name email role")
                .sort({ [safeSortBy]: safeOrder })
                .skip(skip)
                .limit(limitNumber),

            Asset.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: assets.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            filters: {
                status: status || null,
                type: type || null,
                assignedTo: assignedTo || null,
                keyword: keyword || null,
                startDate: startDate || null,
                endDate: endDate || null
            },
            assets
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetById = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate("assignedTo", "name email role");

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        res.status(200).json({
            success: true,
            asset
        });
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        const VALID_ASSET_TRANSITIONS = {
            available: ["assigned", "maintenance", "retired"],
            assigned: ["available", "maintenance", "retired"],
            maintenance: ["available", "retired"],
            retired: ["available"]
        };

        if (req.body.status && req.body.status !== asset.status) {
            const allowed = VALID_ASSET_TRANSITIONS[asset.status] || [];
            if (!allowed.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid asset status transition from "${asset.status}" to "${req.body.status}". Allowed transitions: ${allowed.join(", ") || "none"}`
                });
            }

            if (["available", "retired"].includes(req.body.status)) {
                asset.assignedTo = null;
            }
        }

        const allowedFields = [
            "name",
            "type",
            "brand",
            "model",
            "serialNumber",
            "status",
            "purchaseDate",
            "warrantyExpiry",
            "notes"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                asset[field] = req.body[field];
            }
        }

        await asset.save();

        const populatedAsset = await Asset.findById(asset._id)
            .populate("assignedTo", "name email role");

        res.status(200).json({
            success: true,
            message: "Asset updated successfully",
            asset: populatedAsset
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        await asset.deleteOne();

        res.status(200).json({
            success: true,
            message: "Asset deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const assignAsset = async (req, res, next) => {
    try {
        const { userId } = req.body;

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        if (asset.status !== "available") {
            return res.status(400).json({
                success: false,
                message: "Only available assets can be assigned"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        asset.assignedTo = user._id;
        asset.status = "assigned";

        await asset.save();

        const populatedAsset = await Asset.findById(asset._id)
            .populate("assignedTo", "name email role");

        res.status(200).json({
            success: true,
            message: "Asset assigned successfully",
            asset: populatedAsset
        });
    } catch (error) {
        next(error);
    }
};export const returnAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        if (asset.status !== "assigned") {
            return res.status(400).json({
                success: false,
                message: "Asset is not currently assigned"
            });
        }

        asset.assignedTo = null;
        asset.status = "available";

        await asset.save();

        res.status(200).json({
            success: true,
            message: "Asset returned successfully",
            asset
        });
    } catch (error) {
        next(error);
    }
};

