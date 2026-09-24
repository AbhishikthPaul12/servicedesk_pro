import express from "express";
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from "../controllers/departmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.get(
    "/",
    authorize(
        "system_admin",
        "admin",
        "it_manager",
        "manager",
        "technician",
        "employee",
        "asset_manager"
    ),
    getDepartments
);

router.post(
    "/",
    authorize("system_admin", "admin"),
    createDepartment
);

router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    updateDepartment
);

router.delete(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    deleteDepartment
);

export default router;
