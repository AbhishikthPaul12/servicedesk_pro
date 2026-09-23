import SavedFilter from "../models/SavedFilter.js";

export const createSavedFilter = async (req, res, next) => {
    try {
        const { name, filters } = req.body;

        const savedFilter = await SavedFilter.create({
            user: req.user._id,
            name,
            filters
        });

        res.status(201).json({
            success: true,
            message: "Saved filter created successfully",
            savedFilter
        });
    } catch (error) {
        next(error);
    }
};

export const getSavedFilters = async (req, res, next) => {
    try {
        const savedFilters = await SavedFilter.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: savedFilters.length,
            savedFilters
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSavedFilter = async (req, res, next) => {
    try {
        const filter = await SavedFilter.findById(req.params.id);

        if (!filter) {
            return res.status(404).json({
                success: false,
                message: "Saved filter not found"
            });
        }

        if (filter.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this filter"
            });
        }

        await filter.deleteOne();

        res.status(200).json({
            success: true,
            message: "Saved filter deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
