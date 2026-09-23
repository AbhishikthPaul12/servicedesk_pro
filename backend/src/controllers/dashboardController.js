import {
    getOverviewStats,
    getTicketAnalytics,
    getTechnicianWorkload,
    getAssetAnalytics
} from "../services/dashboardService.js";


export const getOverview = async (req, res, next) => {
    try {
        const stats = await getOverviewStats();

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
        const analytics = await getTicketAnalytics();

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
        const workload = await getTechnicianWorkload();

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