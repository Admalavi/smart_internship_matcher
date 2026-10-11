import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const FILES_URL = import.meta.env.VITE_FILES_URL || 'http://localhost:5000';
export const TOKEN_KEY = 'sim_token';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    const url = e.config?.url || '';
    if (e.response?.status === 401 && localStorage.getItem(TOKEN_KEY) && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : e?.message) || 'Something went wrong';
export const errDetails = (e) => e?.response?.data?.details;

const get = (u, params) => api.get(u, { params }).then((r) => r.data);
const post = (u, b, cfg) => api.post(u, b, cfg).then((r) => r.data);
const put = (u, b) => api.put(u, b).then((r) => r.data);
const del = (u) => api.delete(u).then((r) => r.data);
const form = (file, field) => { const f = new FormData(); f.append(field, file); return f; };

export const authApi = { login: (b) => post('/auth/login', b), register: (b) => post('/auth/register', b), me: () => get('/auth/me') };
export const studentApi = {
  profile: () => get('/students/profile'), updateProfile: (b) => put('/students/profile', b), dashboard: () => get('/students/dashboard'),
  addSkill: (b) => post('/students/skills', b), removeSkill: (id) => del(`/students/skills/${id}`),
  addProject: (b) => post('/students/projects', b), removeProject: (id) => del(`/students/projects/${id}`),
  addCert: (b) => post('/students/certifications', b), removeCert: (id) => del(`/students/certifications/${id}`),
  uploadResume: (file) => post('/students/resume', form(file, 'resume')),
  parseResume: (b) => post('/students/resume/parse', b), activity: () => get('/students/activity'),
};
export const internshipApi = {
  list: (p) => get('/internships', p), one: (id) => get(`/internships/${id}`), facets: () => get('/internships/facets'),
  create: (b) => post('/internships', b), update: (id, b) => put(`/internships/${id}`, b), remove: (id) => del(`/internships/${id}`),
};
export const recApi = {
  list: (p) => get('/recommendations', p), generate: () => post('/recommendations/generate'), one: (id) => get(`/recommendations/${id}`),
  history: () => get('/recommendations/history'), gaps: () => get('/skill-gaps'), gapFor: (id) => get(`/skill-gaps/${id}`),
};
export const appApi = {
  apply: (b) => post('/applications', b), list: (p) => get('/applications', p), one: (id) => get(`/applications/${id}`),
  setStatus: (id, status, note) => put(`/applications/${id}/status`, { status, note }),
};
export const savedApi = { list: () => get('/saved'), save: (id) => post(`/saved/${id}`), unsave: (id) => del(`/saved/${id}`) };
export const companyApi = {
  profile: () => get('/company/profile'), updateProfile: (b) => put('/company/profile', b), uploadLogo: (file) => post('/company/logo', form(file, 'logo')),
  dashboard: () => get('/company/dashboard'), internships: () => get('/company/internships'), applications: (p) => get('/company/applications', p),
  candidate: (id) => get(`/company/applications/${id}`),
};
export const adminApi = {
  dashboard: () => get('/admin/dashboard'), analytics: () => get('/admin/analytics'), users: (p) => get('/admin/users', p),
  setUserStatus: (id, isActive) => put(`/admin/users/${id}/status`, { isActive }), deleteUser: (id) => del(`/admin/users/${id}`),
  companies: (p) => get('/admin/companies', p), verify: (id, verified) => put(`/admin/companies/${id}/verify`, { verified }),
  internships: (p) => get('/admin/internships', p), approval: (id, status, note) => put(`/admin/internships/${id}/approval`, { status, note }),
  applications: (p) => get('/admin/applications', p),
};
export const notifApi = {
  list: () => get('/notifications'), unread: () => get('/notifications/unread-count'), read: (id) => put(`/notifications/${id}/read`),
  readAll: () => put('/notifications/read-all'), remove: (id) => del(`/notifications/${id}`),
};
export const catalogApi = { skills: (p) => get('/catalog/skills', p), stats: () => get('/catalog/stats') };
export default api;
