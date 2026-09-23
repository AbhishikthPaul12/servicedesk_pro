import express from "express";

import {
    ticketReport,
    assetReport,
    technicianReport,
    exportTicketsCSV,
    exportAssetsCSV,
    exportTechniciansCSV
} from "../controllers/reportController.js";

import {
    protect,
    authorize
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
    "/tickets",
    authorize("system_admin", "admin", "it_manager", "manager"),
    ticketReport
);

router.get(
    "/tickets/export",
    authorize("system_admin", "admin", "it_manager", "manager"),
    exportTicketsCSV
);

router.get(
    "/assets",
    authorize("system_admin", "admin", "asset_manager"),
    assetReport
);

router.get(
    "/assets/export",
    authorize("system_admin", "admin", "asset_manager"),
    exportAssetsCSV
);

router.get(
    "/technicians",
    authorize("system_admin", "admin", "it_manager", "manager"),
    technicianReport
);

router.get(
    "/technicians/export",
    authorize("system_admin", "admin", "it_manager", "manager"),
    exportTechniciansCSV
);

export default router;