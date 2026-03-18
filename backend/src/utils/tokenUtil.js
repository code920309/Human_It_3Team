const jwt = require('jsonwebtoken');

/**
 * Access Token 생성 (단기 보호용, 15분)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

/**
 * Refresh Token 생성 (장기 상태 유지용, 30일)
 * isRefresh 플래그를 넣어 일반 토큰과 구분합니다.
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, isRefresh: true },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/**
 * 토큰 검증 함수
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
