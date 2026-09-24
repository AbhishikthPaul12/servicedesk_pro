import express from "express";
import {
    getUsers,
    getAssignableUsers,
    getUserById,
    updateUser,
    createUser
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
    updateUserValidator,
    createUserValidator
} from "../validators/userValidators.js";

const router = express.Router();

router.use(protect);

router.get(
    "/assignable",
    authorize("system_admin", "admin", "asset_manager"),
    getAssignableUsers
);

router.get(
    "/",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getUsers
);

router.post(
    "/",
    authorize("system_admin", "admin"),
    createUserValidator,
    validateRequest,
    createUser
);

router.get(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager"),
    getUserById
);

router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    updateUserValidator,
    validateRequest,
    updateUser
);

export default router;
