import express from "express";

import {
    getOverview,
    getTicketsAnalytics,
    getTechniciansAnalytics,
    getAssetsAnalytics
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
    "/overview",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getOverview
);

router.get(
    "/tickets",
    authorize("system_admin", "admin", "it_manager", "manager"),
    getTicketsAnalytics
);

router.get(
    "/technicians",
    authorize("system_admin", "admin", "it_manager", "manager", "technician"),
    getTechniciansAnalytics
);

router.get(
    "/assets",
    authorize("system_admin", "admin", "it_manager", "manager", "asset_manager"),
    getAssetsAnalytics
);

export default router;