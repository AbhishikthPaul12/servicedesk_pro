import API from "./api";

export const getVendors = async (params = {}) => {
  const res = await API.get("/vendors", { params });
  return res.data;
};

export const getVendorById = async (id) => {
  const res = await API.get(`/vendors/${id}`);
  return res.data;
};

export const createVendor = async (data) => {
  const res = await API.post("/vendors", data);
  return res.data;
};

export const updateVendor = async (id, data) => {
  const res = await API.patch(`/vendors/${id}`, data);
  return res.data;
};

export const deleteVendor = async (id) => {
  const res = await API.delete(`/vendors/${id}`);
  return res.data;
};
