import api from "./api";

// existing

export const fetchProjects = () => api.get("/projects");
export const createProject = (payload) => api.post("/projects", payload);
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);

// new
export const fetchProject = (id) => api.get(`/projects/${id}`);
