import express from "express";

import {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    assignAsset,
    returnAsset
} from "../controllers/assetController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
    createAssetValidator,
    updateAssetValidator
} from "../validators/assetValidators.js";

const router = express.Router();

router.use(protect);

// GET: system_admin, asset_manager, it_manager (read), technician (limited)
router.get(
    "/",
    authorize(
        "system_admin",
        "admin",
        "asset_manager",
        "it_manager",
        "manager",
        "technician"
    ),
    getAssets
);

router.get(
    "/:id",
    validateObjectId("id"),
    authorize(
        "system_admin",
        "admin",
        "asset_manager",
        "it_manager",
        "manager",
        "technician"
    ),
    getAssetById
);

router.post(
    "/",
    authorize("system_admin", "admin", "asset_manager"),
    createAssetValidator,
    validateRequest,
    createAsset
);

router.patch(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin", "asset_manager", "technician"),
    updateAssetValidator,
    validateRequest,
    updateAsset
);

router.delete(
    "/:id",
    validateObjectId("id"),
    authorize("system_admin", "admin", "asset_manager"),
    deleteAsset
);

router.patch(
    "/:id/assign",
    validateObjectId("id"),
    authorize("system_admin", "admin", "asset_manager"),
    assignAsset
);

router.patch(
    "/:id/return",
    validateObjectId("id"),
    authorize("system_admin", "admin", "asset_manager"),
    returnAsset
);

export default router;
