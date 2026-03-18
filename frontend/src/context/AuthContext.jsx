import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /* [수정] 사이트 이탈/브라우저 종료 시 자동 로그아웃을 구별하기 위해 양쪽 스토리지 모두 확인 */
        const token = localStorage.getItem('carelink_token') || sessionStorage.getItem('carelink_token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            console.error('Auth verification failed', err);
            /* [수정] 양쪽 스토리지의 토큰 모두 삭제 (에러 시 초기화) */
            localStorage.removeItem('carelink_token');
            sessionStorage.removeItem('carelink_token');
        } finally {
            setLoading(false);
        }
    };

    const login = (token, userData, keepLoggedIn = false) => {
        /* [수정] 로그인 유지 체크 여부에 따라 저장 위치 분리 */
        if (keepLoggedIn) {
            localStorage.setItem('carelink_token', token);
            sessionStorage.removeItem('carelink_token'); // 확실한 정리를 위해
        } else {
            sessionStorage.setItem('carelink_token', token);
            localStorage.removeItem('carelink_token');   // 확실한 정리를 위해
        }
        setUser(userData);
    };

    const logout = () => {
        /* [수정] 로그아웃 시 로그인 유지/세션 토큰 모두 삭제 */
        localStorage.removeItem('carelink_token');
        sessionStorage.removeItem('carelink_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
