import mongoose from "mongoose";
import Asset from "../models/Asset.js";
import User from "../models/User.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";
import {
    ASSET_TRANSITIONS,
    isValidAssetTransition,
    canReactivateAsset
} from "../utils/assetLifecycle.js";
import {
    canViewAssets,
    canManageAssets,
    deny
} from "../utils/authorization.js";
import {
    isSystemAdmin,
    isAssetManager,
    isTechnician,
    isITManager,
    normalizeRole
} from "../utils/roles.js";

export const createAsset = async (req, res, next) => {
    try {
        if (!canManageAssets(req.user)) {
            return deny(res, "Only Asset Managers and System Admins can create assets");
        }

        const asset = await Asset.create(req.body);

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "asset_created",
            entity: "asset",
            entityId: asset._id,
            description: `Asset ${asset.assetTag} created`
        });

        const populatedAsset = await Asset.findById(asset._id)
            .populate("assignedTo", "name email role")
            .populate("vendor", "name");

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
        if (!canViewAssets(req.user)) {
            return deny(res, "You are not authorized to view assets");
        }

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
            order = "desc",
            includeArchived
        } = req.query;

        const filter = {};

        if (isTechnician(req.user) && !isSystemAdmin(req.user) && !isAssetManager(req.user)) {
            filter.isArchived = { $ne: true };
            filter.status = { $nin: ["retired"] };
            if (status && status !== "retired") {
                filter.status = status;
            }
        } else {
            if (includeArchived !== "true") {
                filter.isArchived = { $ne: true };
            }
            if (status) {
                filter.status = status;
            }
        }

        if (type) filter.type = type;
        if (assignedTo) filter.assignedTo = assignedTo;

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
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
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
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const safeOrder = order === "asc" ? 1 : -1;

        const [assets, total] = await Promise.all([
            Asset.find(filter)
                .populate("assignedTo", "name email role")
                .populate("vendor", "name")
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
        if (!canViewAssets(req.user)) {
            return deny(res, "You are not authorized to view assets");
        }

        const asset = await Asset.findById(req.params.id)
            .populate("assignedTo", "name email role")
            .populate("vendor", "name");

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

        if (isTechnician(req.user) && !canManageAssets(req.user)) {
            const techAllowed = ["notes"];
            if (req.body.status === "maintenance" && asset.status !== "retired") {
                if (!isValidAssetTransition(asset.status, "maintenance")) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot move asset from ${asset.status} to maintenance`
                    });
                }
                const previous = asset.status;
                asset.status = "maintenance";
                await createAuditLog({
                    user: req.user._id,
                    actorRole: normalizeRole(req.user.role),
                    action: "asset_lifecycle_changed",
                    entity: "asset",
                    entityId: asset._id,
                    field: "status",
                    oldValue: previous,
                    newValue: "maintenance",
                    description: `Technician flagged asset ${asset.assetTag} for maintenance`
                });
            }
            for (const field of techAllowed) {
                if (req.body[field] !== undefined) {
                    asset[field] = req.body[field];
                }
            }
            await asset.save();
            const populated = await Asset.findById(asset._id).populate(
                "assignedTo",
                "name email role"
            );
            return res.status(200).json({
                success: true,
                message: "Asset updated successfully",
                asset: populated
            });
        }

        if (!canManageAssets(req.user)) {
            return deny(res, "Only Asset Managers and System Admins can update assets");
        }

        if (req.body.status === "available" && asset.status === "retired") {
            if (!canReactivateAsset(req.user.role)) {
                return deny(res, "Not authorized to reactivate retired assets");
            }
            if (req.body.reactivate !== true && req.body.reactivate !== "true") {
                return res.status(400).json({
                    success: false,
                    message:
                        "Retired assets cannot normally become Available. Set reactivate=true for an audited reactivation."
                });
            }
            const previous = asset.status;
            asset.status = "available";
            asset.assignedTo = null;
            await asset.save();
            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "asset_reactivated",
                entity: "asset",
                entityId: asset._id,
                field: "status",
                oldValue: previous,
                newValue: "available",
                description: `Asset ${asset.assetTag} explicitly reactivated from retired`
            });
            const populated = await Asset.findById(asset._id).populate(
                "assignedTo",
                "name email role"
            );
            return res.status(200).json({
                success: true,
                message: "Asset reactivated successfully",
                asset: populated
            });
        }

        if (req.body.status && req.body.status !== asset.status) {
            if (!isValidAssetTransition(asset.status, req.body.status)) {
                const allowed = ASSET_TRANSITIONS[asset.status] || [];
                return res.status(400).json({
                    success: false,
                    message: `Invalid asset status transition from "${asset.status}" to "${req.body.status}". Allowed: ${allowed.join(", ") || "none"}`
                });
            }

            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "asset_lifecycle_changed",
                entity: "asset",
                entityId: asset._id,
                field: "status",
                oldValue: asset.status,
                newValue: req.body.status,
                description: `Asset ${asset.assetTag} lifecycle: ${asset.status} → ${req.body.status}`
            });

            if (["available", "retired", "procurement"].includes(req.body.status)) {
                asset.assignedTo = null;
            }
        }

        if (isITManager(req.user) && !isSystemAdmin(req.user) && !isAssetManager(req.user)) {
            return deny(res, "IT Managers have read-only access to assets");
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
            "notes",
            "vendor"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                asset[field] = req.body[field];
            }
        }

        await asset.save();

        const populatedAsset = await Asset.findById(asset._id)
            .populate("assignedTo", "name email role")
            .populate("vendor", "name");

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
        if (!canManageAssets(req.user)) {
            return deny(res, "Only Asset Managers and System Admins can archive assets");
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        asset.isArchived = true;
        asset.archivedAt = new Date();
        asset.archivedBy = req.user._id;
        if (asset.status !== "retired") {
            asset.status = "retired";
            asset.assignedTo = null;
        }
        await asset.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "asset_archived",
            entity: "asset",
            entityId: asset._id,
            description: `Asset ${asset.assetTag} archived`
        });

        res.status(200).json({
            success: true,
            message: "Asset archived successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const assignAsset = async (req, res, next) => {
    try {
        if (!canManageAssets(req.user)) {
            return deny(res, "Only Asset Managers and System Admins can assign assets");
        }

        const { userId } = req.body;

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        if (asset.isArchived) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign an archived asset"
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

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign assets to inactive users"
            });
        }

        asset.assignedTo = user._id;
        asset.status = "assigned";
        asset.assignmentHistory.push({
            user: user._id,
            assignedBy: req.user._id,
            assignedAt: new Date()
        });

        await asset.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "asset_assigned",
            entity: "asset",
            entityId: asset._id,
            description: `Asset ${asset.assetTag} assigned to ${user.name}`,
            metadata: { assignedTo: user._id.toString() }
        });

        await createNotification({
            recipient: user._id,
            type: "asset_assigned",
            title: "Asset Assigned",
            message: `Asset ${asset.assetTag} (${asset.name}) has been assigned to you.`
        }).catch(() => {});

        const populatedAsset = await Asset.findById(asset._id).populate(
            "assignedTo",
            "name email role"
        );

        res.status(200).json({
            success: true,
            message: "Asset assigned successfully",
            asset: populatedAsset
        });
    } catch (error) {
        next(error);
    }
};

export const returnAsset = async (req, res, next) => {
    try {
        if (!canManageAssets(req.user)) {
            return deny(res, "Only Asset Managers and System Admins can return assets");
        }

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

        const previousUser = asset.assignedTo;

        if (asset.assignmentHistory?.length) {
            const last = asset.assignmentHistory[asset.assignmentHistory.length - 1];
            if (last && !last.returnedAt) {
                last.returnedAt = new Date();
            }
        }

        asset.assignedTo = null;
        asset.status = "available";
        await asset.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "asset_returned",
            entity: "asset",
            entityId: asset._id,
            description: `Asset ${asset.assetTag} returned`,
            metadata: { previousUser: previousUser?.toString() }
        });

        res.status(200).json({
            success: true,
            message: "Asset returned successfully",
            asset
        });
    } catch (error) {
        next(error);
    }
};
