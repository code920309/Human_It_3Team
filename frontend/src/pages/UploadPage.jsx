import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [manualData, setManualData] = useState({
    height: '', weight: '', waist: '', bpSys: '', bpDia: '', glucose: '', tg: '', hdl: '', ldl: '', ast: '', alt: '', gammaGtp: ''
  });
  const [aiReport, setAiReport] = useState(null);
  const [analysisDone, setAnalysisDone] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setAnalysisDone(false); // 파일 변경 시 분석 초기화
    setAiReport(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (file && !analysisDone) {
        // Step 1: AI 분석(OCR)
        console.log('🚀 Step 1: AI 분석 시작...');
        const formData = new FormData();
        formData.append('reportFile', file);
        formData.append('year', year);
        
        const res = await api.post('/reports/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        console.log('📊 분석 결과:', res.data);

        if (res.data.success) {
          const extracted = res.data.data.healthRecord;
          setManualData({
            height: extracted.height || '', 
            weight: extracted.weight || '',
            waist: extracted.waist || '',
            bpSys: extracted.bpSys || '',
            bpDia: extracted.bpDia || '',
            glucose: extracted.glucose || '',
            tg: extracted.tg || '',
            hdl: extracted.hdl || '',
            ldl: extracted.ldl || '',
            ast: extracted.ast || '',
            alt: extracted.alt || '',
            gammaGtp: extracted.gammaGtp || ''
          });
          setAiReport(res.data.data.aiReport);
          setAnalysisDone(true);
          console.log('✅ AI 분석 완료! 이제 "최종 데이터 확인 및 저장" 버튼을 클릭하세요.');
        } else {
          throw new Error(res.data.message || 'AI 분석 실패');
        }
      } else {
        // Step 2: 데이터 최종 저장
        console.log('🚀 Step 2: 데이터 저장 시작...');
        const payload = {
          year,
          healthRecord: manualData,
          aiReport: aiReport
        };
        console.log('📤 전송 데이터:', payload);
        
        const res = await api.post('/reports/save', payload);
        
        console.log('💾 저장 응답:', res.data);
        
        if (res.data.success) {
          console.log('✅ 저장 완료! MyPage로 이동 중...');
          navigate('/mypage');
        } else {
          throw new Error(res.data.message || '데이터 저장 실패');
        }
      }
    } catch (err) {
      console.error('❌ 오류 상세:', err);
      
      // 토큰 관련 에러 감지
      if (err.response?.status === 401 || err.response?.status === 403) {
        const errorMsg = '세션이 만료되었습니다. 다시 로그인해주세요.';
        alert(`[인증 오류] ${errorMsg}`);
        // 로그인 페이지로 이동
        window.location.href = '/login';
      } else {
        const errorMsg = err.response?.data?.message || err.message || '처리 중 오류가 발생했습니다. 다시 시도해주세요.';
        alert(`[오류] ${errorMsg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/mypage" className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> 뒤로가기
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600 fill-current" />
            <h1 className="text-xl font-black text-slate-900">건강 데이터 입력</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* OCR Upload Section */}
          <section className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 mb-2">스마트 업로드</h2>
              <p className="text-slate-500 font-medium leading-relaxed">검진 결과지 사진이나 PDF를 업로드하면 <br />AI가 자동으로 수치를 정밀하게 추출합니다.</p>
            </div>
            
            <label className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center bg-white hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer group shadow-sm">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all shadow-md ${file ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-teal-500 group-hover:text-white'}`}>
                {file ? <CheckCircle2 className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
              </div>
              <p className="text-slate-900 font-bold mb-2">{file ? file.name : '파일을 드래그하거나 클릭하세요'}</p>
              <p className="text-slate-400 text-sm font-medium">JPG, PNG, PDF (최대 10MB)</p>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="p-6 bg-white rounded-2xl border border-orange-50 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> 분석 프로세스
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">1. 구글 Vision OCR 텍스트 추출</span>
                  <span className={analysisDone ? "text-teal-500 font-bold" : (file ? "text-orange-500 font-bold" : "text-slate-300")}>
                    {analysisDone ? "추출완료" : (file ? "대기 중" : "대기 중")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">2. Gemini 3.0 Flash 지표 분석</span>
                  <span className={analysisDone ? "text-teal-500 font-bold" : (file ? "text-orange-500 font-bold" : "text-slate-300")}>
                    {analysisDone ? "분석완료" : (file ? "대기 중" : "대기 중")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Manual Input & Review Section */}
          <section className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 mb-2">데이터 입력 및 확인</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                빈 칸에 직접 정보를 입력하거나, 스마트 업로드 후 자동 추출된 <br />결과가 맞는지 확인하고 빈 항목을 채워주세요.
              </p>
            </div>

            {analysisDone && aiReport && (
               <div className="bg-teal-50 border border-teal-100 p-6 rounded-3xl shadow-sm text-sm">
                 <h3 className="text-teal-800 font-black flex items-center gap-2 mb-3">
                   <AlertCircle className="w-5 h-5" /> AI 추출 요약
                 </h3>
                 <p className="text-teal-700 leading-relaxed font-medium">{aiReport.summary}</p>
               </div>
            )}

            <form onSubmit={handleUploadSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">검진 연도</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 shadow-inner" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">신장 (cm)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.height} onChange={(e) => setManualData({...manualData, height: e.target.value})} placeholder="예: 170" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">체중 (kg)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.weight} onChange={(e) => setManualData({...manualData, weight: e.target.value})} placeholder="예: 70" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">허리둘레 (cm)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.waist} onChange={(e) => setManualData({...manualData, waist: e.target.value})} placeholder="예: 85" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">수축기 혈압 (mmHg)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.bpSys} onChange={(e) => setManualData({...manualData, bpSys: e.target.value})} placeholder="예: 120" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">이완기 혈압 (mmHg)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.bpDia} onChange={(e) => setManualData({...manualData, bpDia: e.target.value})} placeholder="예: 80" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">공복 혈당</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.glucose} onChange={(e) => setManualData({...manualData, glucose: e.target.value})} placeholder="예: 95" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">중성 지방 (mg/dL)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.tg} onChange={(e) => setManualData({...manualData, tg: e.target.value})} placeholder="예: 140" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">HDL 콜레스테롤 (mg/dL)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.hdl} onChange={(e) => setManualData({...manualData, hdl: e.target.value})} placeholder="예: 50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">LDL 콜레스테롤 (mg/dL)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.ldl} onChange={(e) => setManualData({...manualData, ldl: e.target.value})} placeholder="예: 130" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AST (U/L)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.ast} onChange={(e) => setManualData({...manualData, ast: e.target.value})} placeholder="예: 30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ALT (U/L)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.alt} onChange={(e) => setManualData({...manualData, alt: e.target.value})} placeholder="예: 30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">감마 GTP (U/L)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.gammaGtp} onChange={(e) => setManualData({...manualData, gammaGtp: e.target.value})} placeholder="예: 40" />
                </div>
                {/* 추후 BMI 자동 계산 기능 추가 가능 */}
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  {file && !analysisDone ? "AI 스마트 분석 시작하기" : "최종 데이터 확인 및 저장"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
