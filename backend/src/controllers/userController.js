import User from "../models/User.js";

export const getUsers = async (req, res, next) => {
    try {
        const {
            role,
            department,
            isActive,
            keyword,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            order = "desc"
        } = req.query;

        const filter = {};

        if (
            ["it_manager", "manager"].includes(req.user.role) &&
            req.user.department
        ) {
            filter.department = req.user.department;
        } else if (department) {
            filter.department = department;
        }

        if (role) {
            filter.role = role;
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        if (keyword) {
            filter.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { email: { $regex: keyword, $options: "i" } }
            ];
        }

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 10, 1),
            100
        );
        const skip = (pageNumber - 1) * limitNumber;

        const safeSortBy = [
            "createdAt",
            "name",
            "email",
            "role"
        ].includes(sortBy)
            ? sortBy
            : "createdAt";
        const safeOrder = order === "asc" ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .populate("department", "name")
                .sort({ [safeSortBy]: safeOrder })
                .skip(skip)
                .limit(limitNumber),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page: pageNumber,
            limit: limitNumber,
            pages: Math.ceil(total / limitNumber),
            users
        });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("department", "name");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const allowedFields = ["name", "department", "isActive"];
        
        if (["system_admin", "admin"].includes(req.user.role)) {
            allowedFields.push("role");
        }

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        }

        await user.save();

        const updatedUser = await User.findById(user._id)
            .select("-password")
            .populate("department", "name");

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};
