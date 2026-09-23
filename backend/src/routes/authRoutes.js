import express from "express";

import {
    register,
    login,
    getMe
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);

router.get(
    "/admin-test",
    protect,
    authorize("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "You have admin access"
        });
    }
);

export default router;