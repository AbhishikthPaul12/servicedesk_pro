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

const router = express.Router();

router.use(protect);

router.get("/", getAssets);

router.get("/:id", getAssetById);

router.post(
    "/",
    authorize("system_admin", "admin", "asset_manager"),
    createAsset
);

router.patch(
    "/:id",
    authorize("system_admin", "admin", "asset_manager"),
    updateAsset
);

router.delete(
    "/:id",
    authorize("system_admin", "admin", "asset_manager"),
    deleteAsset
);

router.patch(
    "/:id/assign",
    authorize("system_admin", "admin", "asset_manager"),
    assignAsset
);

router.patch(
    "/:id/return",
    authorize("system_admin", "admin", "asset_manager"),
    returnAsset
);

export default router;