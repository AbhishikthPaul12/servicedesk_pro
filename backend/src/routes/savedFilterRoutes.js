import express from "express";
import {
    createSavedFilter,
    getSavedFilters,
    deleteSavedFilter
} from "../controllers/savedFilterController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createSavedFilter);
router.get("/", getSavedFilters);
router.delete("/:id", deleteSavedFilter);

export default router;
