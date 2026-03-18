import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

/**
 * 전역 인증 관리 Provider
 * [충돌해결] 세션 유지(keepLoggedIn) 기능과 서버 측 로그아웃 호출을 통합하여 최적화했습니다.
 */
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
            /* [수정] 인증 실패 시 모든 저장소의 토큰 초기화 */
            localStorage.removeItem('carelink_token');
            sessionStorage.removeItem('carelink_token');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 로그인 성공 처리
     * [충돌해결] keepLoggedIn 옵션에 따라 토큰 저장 위치를 분기 처리합니다.
     */
    const login = (token, userData, keepLoggedIn = false) => {
        if (keepLoggedIn) {
            localStorage.setItem('carelink_token', token);
            sessionStorage.removeItem('carelink_token');
        } else {
            sessionStorage.setItem('carelink_token', token);
            localStorage.removeItem('carelink_token');
        }
        setUser(userData);
    };

    /**
     * 보안 로그아웃 처리
     * [충돌해결] 서버 세션 파괴 API를 호출하면서 클라이언트의 모든 토큰을 삭제합니다.
     */
    const logout = async () => {
        try {
            // 서버 측 세션/쿠키 파기 시도 (선택 사항이지만 보안상 권장)
            await api.post('/auth/logout');
        } catch (e) {
            console.error('로그아웃 통신 실패:', e);
        } finally {
            /* 모든 스토리지에서 인증 토큰 제거 */
            localStorage.removeItem('carelink_token');
            sessionStorage.removeItem('carelink_token');
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
