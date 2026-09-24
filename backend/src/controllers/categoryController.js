import Category from "../models/Category.js";
import { createAuditLog } from "../services/auditService.js";
import { normalizeRole } from "../utils/roles.js";

export const getCategories = async (req, res, next) => {
    try {
        const { includeInactive } = req.query;
        const filter =
            includeInactive === "true" ? {} : { isActive: { $ne: false } };

        const categories = await Category.find(filter).sort({ displayName: 1 });

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req, res, next) => {
    try {
        const { name, displayName, description } = req.body;
        const normalized = String(name || displayName)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");

        const category = await Category.create({
            name: normalized,
            displayName: displayName || name,
            description: description || "",
            isActive: true
        });

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "category_created",
            entity: "category",
            entityId: category._id,
            description: `Category ${category.displayName} created`
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const { displayName, description, isActive } = req.body;
        if (displayName !== undefined) category.displayName = displayName;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "category_updated",
            entity: "category",
            entityId: category._id,
            description: `Category ${category.displayName} updated`
        });

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        next(error);
    }
};

export const archiveCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.isActive = false;
        await category.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "category_archived",
            entity: "category",
            entityId: category._id,
            description: `Category ${category.displayName} archived`
        });

        res.status(200).json({
            success: true,
            message: "Category archived successfully",
            category
        });
    } catch (error) {
        next(error);
    }
};
