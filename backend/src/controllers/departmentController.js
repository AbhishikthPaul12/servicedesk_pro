import Department from "../models/Department.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import { createAuditLog } from "../services/auditService.js";
import { normalizeRole } from "../utils/roles.js";

export const getDepartments = async (req, res, next) => {
    try {
        const { includeInactive } = req.query;
        const filter =
            includeInactive === "true" ? {} : { isActive: { $ne: false } };

        const departments = await Department.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: departments.length,
            departments
        });
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const department = await Department.create({
            name,
            description: description || "",
            isActive: true
        });

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "department_created",
            entity: "department",
            entityId: department._id,
            description: `Department ${department.name} created`
        });

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department
        });
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const { name, description, isActive } = req.body;
        if (name !== undefined) department.name = name;
        if (description !== undefined) department.description = description;
        if (isActive !== undefined) department.isActive = isActive;

        await department.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "department_updated",
            entity: "department",
            entityId: department._id,
            description: `Department ${department.name} updated`
        });

        res.status(200).json({
            success: true,
            message: "Department updated successfully",
            department
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const [userCount, ticketCount] = await Promise.all([
            User.countDocuments({ department: department._id }),
            Ticket.countDocuments({ department: department._id })
        ]);

        if (userCount > 0 || ticketCount > 0) {
            department.isActive = false;
            await department.save();

            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "department_deactivated",
                entity: "department",
                entityId: department._id,
                description: `Department ${department.name} deactivated (${userCount} users, ${ticketCount} tickets linked)`
            });

            return res.status(200).json({
                success: true,
                message:
                    "Department deactivated because users or tickets are still linked. Linked records were preserved.",
                department
            });
        }

        await department.deleteOne();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "department_deleted",
            entity: "department",
            entityId: department._id,
            description: `Department ${department.name} deleted`
        });

        res.status(200).json({
            success: true,
            message: "Department deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
