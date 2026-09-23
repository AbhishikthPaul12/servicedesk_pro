import express from "express";
import {
    getUsers,
    getUserById,
    updateUser
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { updateUserValidator } from "../validators/userValidators.js";

const router = express.Router();

router.use(protect);

router.get(
    "/",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getUsers
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
    authorize("system_admin", "admin", "it_manager", "manager"),
    updateUserValidator,
    validateRequest,
    updateUser
);

export default router;
