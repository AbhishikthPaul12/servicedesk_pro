import express from "express";

import {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    assignTicket,
    uploadTicketAttachment
} from "../controllers/ticketController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    addComment,
    getTicketComments
} from "../controllers/ticketCommentController.js";

import {
    addWorkLog,
    getWorkLogs,
    deleteWorkLog
} from "../controllers/workLogController.js";

const router = express.Router();

router.use(protect);

router.post("/", upload.array("attachments", 5), createTicket);

router.get("/", getTickets);

router.get("/:id", getTicketById);

router.patch("/:id", updateTicket);

router.patch(
    "/:id/assign",
    authorize("system_admin", "admin", "it_manager", "manager"),
    assignTicket
);

// File attachment upload to existing ticket
router.post(
    "/:id/attachments",
    upload.array("attachments", 5),
    uploadTicketAttachment
);

router.post("/:ticketId/comments", upload.array("attachments", 3), addComment);

router.get("/:ticketId/comments", getTicketComments);

router.post(
    "/:ticketId/work-logs",
    authorize("system_admin", "admin", "it_manager", "manager", "technician"),
    addWorkLog
);

router.get(
    "/:ticketId/work-logs",
    authorize("system_admin", "admin", "it_manager", "manager", "technician"),
    getWorkLogs
);

router.delete(
    "/:ticketId/work-logs/:id",
    authorize("system_admin", "admin", "it_manager", "manager", "technician"),
    deleteWorkLog
);

export default router;