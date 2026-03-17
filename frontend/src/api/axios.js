import axios from 'axios';

// Get API URL from environment variable
// In Netlify, it should be /.netlify/functions/api
// In Local, it's usually http://localhost:5000/api
const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/.netlify/functions/api');

const axiosInstance = axios.create({
    baseURL: API_BASE_URL
});

// Automatically add token and content-type
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('carelink_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Force json content type
        config.headers['Content-Type'] = 'application/json';
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
