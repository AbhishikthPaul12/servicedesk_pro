import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import knowledgeArticleRoutes from "./routes/knowledgeArticleRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import savedFilterRoutes from "./routes/savedFilterRoutes.js";
import slaRoutes from "./routes/slaRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";

import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173"
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
                return callback(null, true);
            }
            return callback(null, true); // Permissive in development/production with credentials
        },
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ResolveDesk API is healthy and running",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/saved-filters", savedFilterRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/knowledge", knowledgeArticleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sla", slaRoutes);
app.use("/api/vendors", vendorRoutes);

// Central error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;