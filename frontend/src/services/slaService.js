import API from "./api";

export const getSLAs = async () => {
  const res = await API.get("/sla");
  return res.data;
};

export const createSLA = async (data) => {
  const res = await API.post("/sla", data);
  return res.data;
};

export const updateSLA = async (id, data) => {
  const res = await API.patch(`/sla/${id}`, data);
  return res.data;
};

export const deleteSLA = async (id) => {
  const res = await API.delete(`/sla/${id}`);
  return res.data;
};
