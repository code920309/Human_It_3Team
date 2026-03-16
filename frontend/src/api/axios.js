import axios from 'axios';

// Get API URL from environment variable, default to localhost for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

// Automatically add token to headers if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('carelink_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
