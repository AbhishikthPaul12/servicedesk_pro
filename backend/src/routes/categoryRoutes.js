import express from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    archiveCategory
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.get("/", getCategories);

router.post(
    "/",
    authorize("system_admin", "admin"),
    createCategory
);

router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    updateCategory
);

router.delete(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    archiveCategory
);

export default router;
