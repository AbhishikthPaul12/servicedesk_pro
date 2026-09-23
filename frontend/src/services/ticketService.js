import API from "./api";

export const getTickets = async (params = {}) => {
  const res = await API.get("/tickets", { params });
  return res.data;
};

export const getTicketById = async (id) => {
  const res = await API.get(`/tickets/${id}`);
  return res.data;
};

export const createTicket = async (ticketData) => {
  const res = await API.post("/tickets", ticketData);
  return res.data;
};

export const updateTicket = async (id, updates) => {
  const res = await API.patch(`/tickets/${id}`, updates);
  return res.data;
};

export const assignTicket = async (id, technicianId) => {
  const res = await API.patch(`/tickets/${id}/assign`, { technicianId });
  return res.data;
};

export const addComment = async (ticketId, commentData, files = []) => {
  if (files.length > 0) {
    const formData = new FormData();
    formData.append("content", commentData.content);
    formData.append("type", commentData.type || "comment");
    files.forEach((f) => formData.append("attachments", f));
    const res = await API.post(`/tickets/${ticketId}/comments`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  }
  const res = await API.post(`/tickets/${ticketId}/comments`, commentData);
  return res.data;
};

export const getTicketComments = async (ticketId) => {
  const res = await API.get(`/tickets/${ticketId}/comments`);
  return res.data;
};

export const uploadAttachments = async (ticketId, files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("attachments", f));
  const res = await API.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const addWorkLog = async (ticketId, workLogData) => {
  const res = await API.post(`/tickets/${ticketId}/work-logs`, workLogData);
  return res.data;
};

export const getWorkLogs = async (ticketId) => {
  const res = await API.get(`/tickets/${ticketId}/work-logs`);
  return res.data;
};

export const deleteWorkLog = async (ticketId, logId) => {
  const res = await API.delete(`/tickets/${ticketId}/work-logs/${logId}`);
  return res.data;
};


export const analyzeTicket = async (id) => {
  const res = await API.post(`/ai/tickets/${id}/analyze`);
  return res.data;
};

export const getKBSuggestions = async (id) => {
  const res = await API.post(`/ai/tickets/${id}/knowledge-suggestions`);
  return res.data;
};

export const getSavedFilters = async () => {
  const res = await API.get("/saved-filters");
  return res.data;
};

export const createSavedFilter = async (filterData) => {
  const res = await API.post("/saved-filters", filterData);
  return res.data;
};

export const deleteSavedFilter = async (id) => {
  const res = await API.delete(`/saved-filters/${id}`);
  return res.data;
};
