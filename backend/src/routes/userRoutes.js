import express from "express";
import {
    getUsers,
    getUserById,
    updateUser
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
    "/",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getUsers
);

router.get(
    "/:id",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getUserById
);

router.patch(
    "/:id",
    authorize("system_admin", "admin", "it_manager", "manager"),
    updateUser
);

export default router;
