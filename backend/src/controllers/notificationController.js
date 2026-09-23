import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
            .populate("ticket", "ticketNumber title status")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsRead = async (
    req,
    res,
    next
) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.isRead = true;

        await notification.save();

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsRead = async (
    req,
    res,
    next
) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user._id,
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        next(error);
    }
};