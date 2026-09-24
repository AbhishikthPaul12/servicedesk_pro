import API from "./api";

export const getUsers = async (params = {}) => {
  const res = await API.get("/users", { params });
  return res.data;
};

export const getUserById = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id, userData) => {
  const res = await API.patch(`/users/${id}`, userData);
  return res.data;
};

export const createUser = async (userData) => {
  const res = await API.post("/users", userData);
  return res.data;
};
