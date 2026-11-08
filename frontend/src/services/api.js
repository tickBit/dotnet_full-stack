import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5079';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

let refreshRequest;

export function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios.post(
      `${apiBaseUrl}/api/users/refresh`,
      {},
      { withCredentials: true }
    ).then((response) => {
      const token = response.data?.token;
      if (!token) {
        throw new Error('Refresh endpoint did not return an access token.');
      }

      localStorage.setItem('token_demo', token);
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: token }));
      return token;
    }).catch((error) => {
      if (error.response?.status === 401) {
        window.dispatchEvent(new Event('auth:refresh-failed'));
      }
      throw error;
    }).finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_demo');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthRequest = request?.url?.includes('/api/users/login')
      || request?.url?.includes('/api/users/register')
      || request?.url?.includes('/api/users/refresh')
      || request?.url?.includes('/api/users/logout');

    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest) {
      throw error;
    }

    request._retry = true;

    let token;
    try {
      token = await refreshAccessToken();
    } catch {
      throw error;
    }

    request.headers.Authorization = `Bearer ${token}`;
    return api.request(request);
  }
);

export default api;
