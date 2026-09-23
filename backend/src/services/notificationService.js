import Notification from "../models/Notification.js";

export const createNotification = async ({
    recipient,
    ticket = null,
    type,
    title,
    message
}) => {
    return await Notification.create({
        recipient,
        ticket,
        type,
        title,
        message
    });
};

export const notifyUsers = async ({
    users,
    ticket = null,
    type,
    title,
    message
}) => {
    const notifications = users.map((user) => ({
        recipient: user._id,
        ticket,
        type,
        title,
        message
    }));

    if (notifications.length === 0) {
        return [];
    }

    return await Notification.insertMany(notifications);
};