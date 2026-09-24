import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createAuditLog } from "../services/auditService.js";
import { isSystemAdmin, isITManager, normalizeRole, sameId } from "../utils/roles.js";
import { deny } from "../utils/authorization.js";
import {
    resolveActiveDepartment,
    rolesRequiringDepartment
} from "../utils/departmentValidation.js";

const CREATABLE_ROLES = [
    "employee",
    "technician",
    "it_manager",
    "asset_manager",
    "system_admin"
];

export const getUsers = async (req, res, next) => {
    try {
        const {
            role,
            department,
            isActive,
            keyword,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = {};

        if (isITManager(req.user)) {
            if (!req.user.department) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your IT Manager account is not assigned to a department. Please contact a System Admin."
                });
            }
            filter.department = req.user.department;
        } else if (department) {
            filter.department = department;
        }

        if (role) {
            filter.role = role;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        if (keyword) {
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } }
            ];
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const safeSortBy = ["createdAt", "name", "email", "role"].includes(sortBy)
            ? sortBy
            : "createdAt";
        const safeOrder = order === "asc" ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .populate("department", "name")
                .sort({ [safeSortBy]: safeOrder })
                .skip(skip)
                .limit(limitNumber),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            users,
            readOnly: isITManager(req.user)
        });
    } catch (error) {
        next(error);
    }
};

export const getAssignableUsers = async (req, res, next) => {
    try {
        const filter = { isActive: true };

        if (req.query.keyword) {
            filter.$or = [
                { name: { $regex: req.query.keyword, $options: "i" } },
                { email: { $regex: req.query.keyword, $options: "i" } }
            ];
        }

        if (req.query.department) {
            filter.department = req.query.department;
        }

        if (req.query.role) {
            filter.role = req.query.role;
        }

        const users = await User.find(filter)
            .select("_id name email role department")
            .populate("department", "name")
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("department", "name");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (
            isITManager(req.user) &&
            req.user.department &&
            (!user.department || !sameId(user.department, req.user.department))
        ) {
            return deny(res, "You can only view users in your department");
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    try {
        if (!isSystemAdmin(req.user)) {
            return deny(res, "Only System Admins can create users");
        }

        const { name, email, password, role, department, isActive } = req.body;

        if (!CREATABLE_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Allowed: ${CREATABLE_ROLES.join(", ")}`
            });
        }

        const needsDepartment = rolesRequiringDepartment(role);
        const deptResult = await resolveActiveDepartment(department, {
            required: needsDepartment
        });
        if (!deptResult.ok) {
            return res.status(deptResult.status).json({
                success: false,
                message: deptResult.message
            });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            department: deptResult.department ? deptResult.department._id : null,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "user_created",
            entity: "user",
            entityId: user._id,
            description: `User ${user.email} created with role ${role}`,
            metadata: {
                role,
                department: deptResult.department
                    ? deptResult.department._id.toString()
                    : null
            }
        });

        const created = await User.findById(user._id)
            .select("-password")
            .populate("department", "name");

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: created
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        if (isITManager(req.user) && !isSystemAdmin(req.user)) {
            return deny(
                res,
                "IT Managers have a read-only team directory and cannot modify users"
            );
        }

        if (!isSystemAdmin(req.user)) {
            return deny(res, "Only System Admins can update users");
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const previousRole = user.role;
        const previousActive = user.isActive;
        const previousDept = user.department;

        const nextRole =
            req.body.role !== undefined ? req.body.role : user.role;

        if (
            req.body.role !== undefined &&
            !CREATABLE_ROLES.includes(req.body.role)
        ) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Allowed: ${CREATABLE_ROLES.join(", ")}`
            });
        }

        if (req.body.department !== undefined) {
            const needsDepartment = rolesRequiringDepartment(nextRole);
            const deptResult = await resolveActiveDepartment(req.body.department, {
                required: needsDepartment
            });
            if (!deptResult.ok) {
                return res.status(deptResult.status).json({
                    success: false,
                    message: deptResult.message
                });
            }
            user.department = deptResult.department
                ? deptResult.department._id
                : null;
        } else if (
            req.body.role !== undefined &&
            rolesRequiringDepartment(req.body.role) &&
            !user.department
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Department is required when assigning Employee, Technician, or IT Manager roles"
            });
        }

        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.role !== undefined) user.role = req.body.role;
        if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

        await user.save();

        if (req.body.role && req.body.role !== previousRole) {
            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "user_role_changed",
                entity: "user",
                entityId: user._id,
                field: "role",
                oldValue: previousRole,
                newValue: req.body.role,
                description: `Role changed for ${user.email}`
            });
        }

        if (
            req.body.isActive !== undefined &&
            Boolean(req.body.isActive) !== previousActive
        ) {
            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: req.body.isActive ? "user_activated" : "user_deactivated",
                entity: "user",
                entityId: user._id,
                field: "isActive",
                oldValue: String(previousActive),
                newValue: String(req.body.isActive),
                description: `User ${user.email} ${req.body.isActive ? "activated" : "deactivated"}`
            });
        }

        if (
            req.body.department !== undefined &&
            String(user.department || "") !== String(previousDept || "")
        ) {
            await createAuditLog({
                user: req.user._id,
                actorRole: normalizeRole(req.user.role),
                action: "user_department_changed",
                entity: "user",
                entityId: user._id,
                field: "department",
                oldValue: previousDept?.toString() || null,
                newValue: user.department?.toString() || null,
                description: `Department changed for ${user.email}`
            });
        }

        const updatedUser = await User.findById(user._id)
            .select("-password")
            .populate("department", "name");

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};
