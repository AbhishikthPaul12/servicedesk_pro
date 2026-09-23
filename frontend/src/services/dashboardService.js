import API from "./api";

export const getOverview = async () => {
  const res = await API.get("/dashboard/overview");
  return res.data;
};

export const getTicketsAnalytics = async () => {
  const res = await API.get("/dashboard/tickets");
  return res.data;
};

export const getTechniciansAnalytics = async () => {
  const res = await API.get("/dashboard/technicians");
  return res.data;
};

export const getAssetsAnalytics = async () => {
  const res = await API.get("/dashboard/assets");
  return res.data;
};
