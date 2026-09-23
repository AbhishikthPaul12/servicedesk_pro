import SLA from "../models/SLA.js";

export const getSLAs = async (req, res, next) => {
    try {
        const slas = await SLA.find().sort({ priority: 1 });
        res.status(200).json({ success: true, data: slas });
    } catch (error) {
        next(error);
    }
};

export const getSLAById = async (req, res, next) => {
    try {
        const sla = await SLA.findById(req.params.id);
        if (!sla) return res.status(404).json({ success: false, message: "SLA not found" });
        res.status(200).json({ success: true, data: sla });
    } catch (error) {
        next(error);
    }
};

export const createSLA = async (req, res, next) => {
    try {
        const { name, priority, responseTime, resolutionTime, isActive } = req.body;

        const exists = await SLA.findOne({ priority });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: `An SLA for priority "${priority}" already exists. Update it instead.`
            });
        }

        const sla = await SLA.create({ name, priority, responseTime, resolutionTime, isActive });
        res.status(201).json({ success: true, message: "SLA created successfully", data: sla });
    } catch (error) {
        next(error);
    }
};

export const updateSLA = async (req, res, next) => {
    try {
        const { name, responseTime, resolutionTime, isActive } = req.body;

        const sla = await SLA.findById(req.params.id);
        if (!sla) return res.status(404).json({ success: false, message: "SLA not found" });

        if (name !== undefined) sla.name = name;
        if (responseTime !== undefined) sla.responseTime = responseTime;
        if (resolutionTime !== undefined) sla.resolutionTime = resolutionTime;
        if (isActive !== undefined) sla.isActive = isActive;

        await sla.save();
        res.status(200).json({ success: true, message: "SLA updated successfully", data: sla });
    } catch (error) {
        next(error);
    }
};

export const deleteSLA = async (req, res, next) => {
    try {
        const sla = await SLA.findByIdAndDelete(req.params.id);
        if (!sla) return res.status(404).json({ success: false, message: "SLA not found" });
        res.status(200).json({ success: true, message: "SLA deleted successfully" });
    } catch (error) {
        next(error);
    }
};
