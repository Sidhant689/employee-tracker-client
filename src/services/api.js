// api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Add response interceptor to handle token expiration
API.interceptors.response.use(
    response => response,
    error => {
        // Handle unauthorized errors (expired token, etc.)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login'; // Force redirect to login
        }
        return Promise.reject(error);
    }
);
  
export default API;