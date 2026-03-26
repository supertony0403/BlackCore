import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

let accessToken = null;

export function setToken(token) { accessToken = token; }
export function clearToken() { accessToken = null; }

api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        setToken(data.token);
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original);
      } catch {
        clearToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/users/@me');
export const updateMe = (data) => api.patch('/users/@me', data);
export const enable2FA = () => api.post('/auth/2fa/enable');
export const verify2FA = (code) => api.post('/auth/2fa/verify', { code });
export const disable2FA = () => api.post('/auth/2fa/disable');

export const getServers = () => api.get('/servers');
export const createServer = (data) => api.post('/servers', data);
export const getChannels = (serverId) => api.get(`/servers/${serverId}/channels`);
export const createChannel = (serverId, data) => api.post(`/servers/${serverId}/channels`, data);
export const joinServer = (serverId) => api.post(`/servers/${serverId}/join`);

export const getMessages = (channelId, params) => api.get(`/channels/${channelId}/messages`, { params });
export const sendMessage = (channelId, content) => api.post(`/channels/${channelId}/messages`, { content });
export const uploadFile = (channelId, file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/channels/${channelId}/upload`, form);
};

export default api;
