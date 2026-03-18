import axios from 'axios';

/**
 * CareLink 통합 API 인스턴스
 * - baseURL: 환경별 API 주소 자동 설정
 * - withCredentials: true (HttpOnly 쿠키 송수신 활성화)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// 토큰 갱신 중복 방지를 위한 상태 관리
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

/**
 * 1. 요청 인터셉터: 모든 요청에 Access Token 자동 첨부
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('carelink_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * 2. 응답 인터셉터: 401 에러 발생 시 자동 토큰 갱신 (Silent Refresh)
 */
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401(Unauthorized) 에러 발생 시 토큰 갱신 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                // 백엔드의 /auth/refresh 엔드포인트 호출 (쿠키 사용)
                // axios 대신 api 인스턴스 사용 (withCredentials 보장)
                const res = await api.post('/auth/refresh', {});
                
                if (res.data.success) {
                    const newToken = res.data.accessToken;
                    localStorage.setItem('carelink_token', newToken);
                    
                    onRefreshed(newToken);
                    isRefreshing = false;
                    
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshErr) {
                // Refresh Token도 만료된 경우 로그아웃 처리
                isRefreshing = false;
                onRefreshed(null);
                localStorage.removeItem('carelink_token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
