import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Track if a token refresh is in progress
let isRefreshing = false;
// Queue of callbacks to execute after token refresh
let refreshSubscribers = [];

// Helper function to subscribe to token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Helper function to notify all subscribers about token refresh
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Helper function to get auth token from storage (localStorage or sessionStorage)
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to get refresh token from storage
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

// Helper function to get persistence setting
const isPersistent = () => {
  return localStorage.getItem('isPersistent') === 'true';
};

// Helper function to get new tokens using refresh token
const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
    refreshToken
  });
  
  const { accessToken, refreshToken: newRefreshToken, expiresAt, isPersistent: persistent } = response.data;
  
  // Clear both storages
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('isPersistent');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('tokenExpiry');
  sessionStorage.removeItem('isPersistent');
  
  // Choose storage based on persistence
  const storage = persistent ? localStorage : sessionStorage;
  
  // Store tokens
  storage.setItem('token', accessToken);
  storage.setItem('refreshToken', newRefreshToken);
  storage.setItem('tokenExpiry', expiresAt);
  storage.setItem('isPersistent', persistent);
  
  return accessToken;
};

// Request interceptor to add auth token
API.interceptors.request.use(async config => {
  let token = getAuthToken();
  
  // If token exists and isn't a refresh token request
  if (token && !config.url.includes('refresh-token')) {
    try {
      // Check token expiration
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // If token is expired and we're not already refreshing
      if (decoded.exp < currentTime && !isRefreshing) {
        isRefreshing = true;
        
        try {
          // Get new token
          const newToken = await refreshAuthToken();
          // Update all pending requests with new token
          onTokenRefreshed(newToken);
          // Update current request with new token
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // Failed to refresh token, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('isPersistent');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('tokenExpiry');
          sessionStorage.removeItem('isPersistent');
          window.location.href = '/login';
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      } else if (decoded.exp < currentTime && isRefreshing) {
        // Token expired but refresh is in progress, wait for new token
        return new Promise((resolve) => {
          subscribeTokenRefresh(newToken => {
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
          });
        });
      } else {
        // Token still valid
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Invalid token, try to refresh it
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshAuthToken();
          onTokenRefreshed(newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('isPersistent');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('tokenExpiry');
          sessionStorage.removeItem('isPersistent');
          window.location.href = '/login';
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Refresh already in progress, wait for new token
        return new Promise((resolve) => {
          subscribeTokenRefresh(newToken => {
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
          });
        });
      }
    }
  }
  
  return config;
});

// Response interceptor to handle authentication errors
API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 and not a refresh token request and we haven't tried to refresh yet
    if (error.response && error.response.status === 401 && 
        !originalRequest.url.includes('refresh-token') && 
        !originalRequest._retry) {
      
      // Mark this request as retried already
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Try to refresh the token
          const newToken = await refreshAuthToken();
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Notify all requests waiting for token refresh
          onTokenRefreshed(newToken);
          
          // Retry the original request
          return API(originalRequest);
        } catch (refreshError) {
          // Failed to refresh token, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiry');
          localStorage.removeItem('isPersistent');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('tokenExpiry');
          sessionStorage.removeItem('isPersistent');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Refresh already in progress, wait for new token
        return new Promise((resolve) => {
          subscribeTokenRefresh(newToken => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(API(originalRequest));
          });
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to save tokens based on persistence preference
export const saveAuthTokens = (accessToken, refreshToken, expiresAt, persistent = false) => {
  // Clear both storages first
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('isPersistent');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('tokenExpiry');
  sessionStorage.removeItem('isPersistent');
  
  // Choose storage based on persistence setting
  const storage = persistent ? localStorage : sessionStorage;
  
  // Store tokens
  storage.setItem('token', accessToken);
  storage.setItem('refreshToken', refreshToken);
  storage.setItem('tokenExpiry', expiresAt);
  storage.setItem('isPersistent', persistent.toString());
};

// Helper function to clear auth tokens from both storages
export const clearAuthTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('isPersistent');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('tokenExpiry');
  sessionStorage.removeItem('isPersistent');
};

export default API;