import SystemConfig from "../models/SystemConfig.js";
import { getSystemConfig } from "../services/slaService.js";
import { createAuditLog } from "../services/auditService.js";
import { normalizeRole } from "../utils/roles.js";

export const getConfig = async (req, res, next) => {
    try {
        const config = await getSystemConfig();
        res.status(200).json({
            success: true,
            config
        });
    } catch (error) {
        next(error);
    }
};

export const updateConfig = async (req, res, next) => {
    try {
        const config = await getSystemConfig();

        if (req.body.businessHours) {
            config.businessHours = {
                ...config.businessHours?.toObject?.() || config.businessHours || {},
                ...req.body.businessHours
            };
        }

        if (req.body.slaAtRiskThresholdPercent !== undefined) {
            const pct = Number(req.body.slaAtRiskThresholdPercent);
            if (pct < 1 || pct > 99) {
                return res.status(400).json({
                    success: false,
                    message: "slaAtRiskThresholdPercent must be between 1 and 99"
                });
            }
            config.slaAtRiskThresholdPercent = pct;
        }

        if (req.body.notificationSettings) {
            config.notificationSettings = {
                ...config.notificationSettings?.toObject?.() ||
                    config.notificationSettings ||
                    {},
                ...req.body.notificationSettings
            };
        }

        if (req.body.allowedTicketCategories) {
            config.allowedTicketCategories = req.body.allowedTicketCategories;
        }

        await config.save();

        await createAuditLog({
            user: req.user._id,
            actorRole: normalizeRole(req.user.role),
            action: "system_config_updated",
            entity: "system_config",
            entityId: config._id,
            description: "System configuration updated"
        });

        res.status(200).json({
            success: true,
            message: "System configuration updated",
            config
        });
    } catch (error) {
        next(error);
    }
};
