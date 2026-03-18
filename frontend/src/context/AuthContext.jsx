import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

/**
 * 전역 인증 관리 Provider
 * - 자동 로그인 (CheckAuth)
 * - 이중 토큰 기반 로그인/로그아웃 처리
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('carelink_token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    /**
     * 페이지 새로고침 시 Access Token 유효성 검사 및 유저 정보 복구
     */
    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            console.error('❌ 인증 세션 복구 실패:', err.message);
            // 403/401 에러는 토큰 만료로 인터셉터에서 처리됨
            // 기타 에러는 조용히 무시하고 토큰 제거
            localStorage.removeItem('carelink_token');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 로그인 성공 처리
     */
    const login = (accessToken, userData) => {
        localStorage.setItem('carelink_token', accessToken);
        setUser(userData);
    };

    /**
     * 보안 로그아웃 처리 (서버 세션 및 클라이언트 토큰 모두 파괴)
     */
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error('로그아웃 통신 실패:', e);
        } finally {
            localStorage.removeItem('carelink_token');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
