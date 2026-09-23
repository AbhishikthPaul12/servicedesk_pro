import express from "express";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from "../controllers/notificationController.js";

import { protect } from "../middleware/authMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);

router.patch("/read-all", markAllNotificationsAsRead);

router.patch("/:id/read", validateObjectId("id"), markNotificationAsRead);

export default router;