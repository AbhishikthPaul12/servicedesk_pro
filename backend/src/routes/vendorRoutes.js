import express from "express";
import { getVendors, getVendorById, createVendor, updateVendor, deleteVendor } from "../controllers/vendorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Asset managers, admins, IT managers can view vendors
router.get("/", authorize("system_admin", "admin", "it_manager", "manager", "asset_manager"), getVendors);
router.get("/:id", authorize("system_admin", "admin", "it_manager", "manager", "asset_manager"), getVendorById);

// Only admins and asset managers can create/update/delete
router.post("/", authorize("system_admin", "admin", "asset_manager"), createVendor);
router.patch("/:id", authorize("system_admin", "admin", "asset_manager"), updateVendor);
router.delete("/:id", authorize("system_admin", "admin"), deleteVendor);

export default router;
