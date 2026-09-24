import {
    getOverviewStats,
    getTicketAnalytics,
    getTechnicianWorkload,
    getAssetAnalytics
} from "../services/dashboardService.js";
import { isITManager } from "../utils/roles.js";

const requireManagerDepartment = (req, res) => {
    if (isITManager(req.user) && !req.user.department) {
        res.status(403).json({
            success: false,
            message:
                "Your IT Manager account is not assigned to a department. Please contact a System Admin."
        });
        return false;
    }
    return true;
};

export const getOverview = async (req, res, next) => {
    try {
        if (!requireManagerDepartment(req, res)) return;

        const stats = await getOverviewStats(req.user);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

export const getTicketsAnalytics = async (req, res, next) => {
    try {
        if (!requireManagerDepartment(req, res)) return;

        const analytics = await getTicketAnalytics(req.user);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

export const getTechniciansAnalytics = async (req, res, next) => {
    try {
        if (!requireManagerDepartment(req, res)) return;

        const workload = await getTechnicianWorkload(req.user);

        res.status(200).json({
            success: true,
            data: workload
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetsAnalytics = async (req, res, next) => {
    try {
        const analytics = await getAssetAnalytics();

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};
