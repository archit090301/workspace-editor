import api from "./api";

const apiFiles = {
  fetchFiles: (projectId) => api.get(`/projects/${projectId}/files`),
  fetchFile: (fileId) => api.get(`/files/${fileId}`),
  createFile: (projectId, file_name, language_id = 63) =>
    api.post(`/projects/${projectId}/files`, { file_name, language_id }),
  updateFile: (fileId, content, language_id) =>
    api.put(`/files/${fileId}`, { content, language_id }),
};

export default apiFiles;
