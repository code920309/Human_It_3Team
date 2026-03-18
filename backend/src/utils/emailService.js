/**
 * 실제 운영 시에는 nodemailer 등을 사용하여 이메일을 발송합니다.
 * 현재는 개발 단계이므로 콘솔에 출력하는 방식으로 Mock 구현되어 있습니다.
 */
exports.sendOTP = async (email, otp, type = 'verify') => {
    try {
        console.log(`[EMAIL SEND] To: ${email} | Type: ${type} | Code: ${otp}`);
        
        // 실제 발송 로직 (예시):
        // await transporter.sendMail({...});

        return { success: true };
    } catch (err) {
        console.error('Email service error:', err);
        return { success: false, error: err.message };
    }
};
