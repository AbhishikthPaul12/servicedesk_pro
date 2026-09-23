import API from "./api";

export const getNotifications = async () => {
  const res = await API.get("/notifications");
  return res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await API.patch(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await API.patch("/notifications/read-all");
  return res.data;
};
