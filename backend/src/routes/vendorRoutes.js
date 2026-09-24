import express from "express";
import {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
} from "../controllers/vendorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
    createVendorValidator,
    updateVendorValidator
} from "../validators/vendorValidators.js";

const router = express.Router();

router.use(protect);

router.get(
    "/",
    authorize("system_admin", "admin", "it_manager", "manager", "asset_manager"),
    getVendors
);

router.get(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager", "asset_manager"),
    getVendorById
);

router.post(
    "/",
    authorize("system_admin", "admin", "asset_manager"),
    createVendorValidator,
    validateRequest,
    createVendor
);

router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin", "asset_manager"),
    updateVendorValidator,
    validateRequest,
    updateVendor
);

router.delete(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin"),
    deleteVendor
);

export default router;
