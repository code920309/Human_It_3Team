const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/* [수정] 환경변수가 없을 경우 에러 방지를 위해 변수 확인 후 클라이언트 생성 */
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error('🚨 [오류] Netlify 또는 서버에 SUPABASE_URL 및 SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.');
}

module.exports = supabase;
