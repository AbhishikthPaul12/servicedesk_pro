import API from "./api";

export const getArticles = async (params = {}) => {
  const res = await API.get("/knowledge", { params });
  return res.data;
};

export const getArticleById = async (id) => {
  const res = await API.get(`/knowledge/${id}`);
  return res.data;
};

export const createArticle = async (articleData) => {
  const res = await API.post("/knowledge", articleData);
  return res.data;
};

export const updateArticle = async (id, articleData) => {
  const res = await API.patch(`/knowledge/${id}`, articleData);
  return res.data;
};

export const deleteArticle = async (id) => {
  const res = await API.delete(`/knowledge/${id}`);
  return res.data;
};

export const markHelpful = async (id) => {
  const res = await API.patch(`/knowledge/${id}/helpful`);
  return res.data;
};

export const markNotHelpful = async (id) => {
  const res = await API.patch(`/knowledge/${id}/not-helpful`);
  return res.data;
};
