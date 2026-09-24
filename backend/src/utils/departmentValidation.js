import mongoose from "mongoose";
import Department from "../models/Department.js";

/**
 * Validate a department ID for user assignment.
 * Returns { ok: true, department } or { ok: false, status, message }.
 */
export const resolveActiveDepartment = async (departmentId, { required = false } = {}) => {
    if (!departmentId) {
        if (required) {
            return {
                ok: false,
                status: 400,
                message: "Department is required"
            };
        }
        return { ok: true, department: null };
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return {
            ok: false,
            status: 400,
            message: "Invalid department ID"
        };
    }

    const department = await Department.findById(departmentId);
    if (!department) {
        return {
            ok: false,
            status: 400,
            message: "Department not found"
        };
    }

    if (department.isActive === false) {
        return {
            ok: false,
            status: 400,
            message: "Cannot assign an inactive department"
        };
    }

    return { ok: true, department };
};

/** Roles that must have a department for operational ticket/dept scoping. */
export const rolesRequiringDepartment = (role) =>
    ["employee", "technician", "it_manager", "manager"].includes(role);
