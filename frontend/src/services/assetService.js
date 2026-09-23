import API from "./api";

export const getAssets = async (params = {}) => {
  const res = await API.get("/assets", { params });
  return res.data;
};

export const getAssetById = async (id) => {
  const res = await API.get(`/assets/${id}`);
  return res.data;
};

export const createAsset = async (assetData) => {
  const res = await API.post("/assets", assetData);
  return res.data;
};

export const updateAsset = async (id, assetData) => {
  const res = await API.patch(`/assets/${id}`, assetData);
  return res.data;
};

export const deleteAsset = async (id) => {
  const res = await API.delete(`/assets/${id}`);
  return res.data;
};

export const assignAsset = async (id, userId) => {
  const res = await API.patch(`/assets/${id}/assign`, { userId });
  return res.data;
};

export const returnAsset = async (id) => {
  const res = await API.patch(`/assets/${id}/return`);
  return res.data;
};
