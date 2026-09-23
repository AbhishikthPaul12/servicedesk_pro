import express from "express";
import { getSLAs, getSLAById, createSLA, updateSLA, deleteSLA } from "../controllers/slaController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// All roles can read SLAs (needed for ticket creation context)
router.get("/", getSLAs);
router.get("/:id", getSLAById);

// Only system admin can mutate SLAs
router.post("/", authorize("system_admin", "admin"), createSLA);
router.patch("/:id", authorize("system_admin", "admin"), updateSLA);
router.delete("/:id", authorize("system_admin", "admin"), deleteSLA);

export default router;
