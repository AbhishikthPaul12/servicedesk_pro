import express from "express";

import {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    assignTicket,
    uploadTicketAttachment,
    approveTicket,
    rejectTicket,
    escalateTicket
} from "../controllers/ticketController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
    createTicketValidator,
    updateTicketValidator,
    assignTicketValidator,
    createCommentValidator,
    createWorkLogValidator
} from "../validators/ticketValidators.js";

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

router.post(
    "/",
    authorize("employee", "technician", "it_manager", "system_admin", "admin", "manager"),
    upload.array("attachments", 5),
    createTicketValidator,
    validateRequest,
    createTicket
);

router.get("/", getTickets);

router.get("/:id", validateObjectId("id"), getTicketById);

router.patch(
    "/:id",
    validateObjectId("id"),
    updateTicketValidator,
    validateRequest,
    updateTicket
);

router.patch(
    "/:id/assign",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager"),
    assignTicketValidator,
    validateRequest,
    assignTicket
);

router.post(
    "/:id/approve",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager"),
    approveTicket
);

router.post(
    "/:id/reject",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager"),
    rejectTicket
);

router.post(
    "/:id/escalate",
    validateObjectId("id"),
    authorize("system_admin", "admin", "it_manager", "manager"),
    escalateTicket
);

router.post(
    "/:id/attachments",
    validateObjectId("id"),
    upload.array("attachments", 5),
    uploadTicketAttachment
);

router.post(
    "/:ticketId/comments",
    validateObjectId("ticketId"),
    upload.array("attachments", 3),
    createCommentValidator,
    validateRequest,
    addComment
);

router.get(
    "/:ticketId/comments",
    validateObjectId("ticketId"),
    getTicketComments
);

router.post(
    "/:ticketId/work-logs",
    validateObjectId("ticketId"),
    authorize("system_admin", "admin", "technician"),
    createWorkLogValidator,
    validateRequest,
    addWorkLog
);

router.get(
    "/:ticketId/work-logs",
    validateObjectId("ticketId"),
    authorize("system_admin", "admin", "it_manager", "manager", "technician"),
    getWorkLogs
);

router.delete(
    "/:ticketId/work-logs/:id",
    validateObjectId("ticketId"),
    validateObjectId("id"),
    authorize("system_admin", "admin", "technician"),
    deleteWorkLog
);

export default router;
