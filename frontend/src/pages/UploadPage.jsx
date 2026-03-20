import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

/* MERGED FROM 업로드OCR: 게스트 분석 지원 및 다국어 처리 */

export default function UploadPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestGender, setGuestGender] = useState('M');
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
        // Step 1: AI 분석(OCR) - 프론트엔드 직접 분석으로 변경 (서버리스 Timeout 방지)
        console.log('🚀 Step 1: 프론트엔드 전용 AI 분석 시작...');
        
        let targetAge = guestAge;
        let targetGender = guestGender;

        if (user) {
           if (user.birth_date) {
               targetAge = new Date().getFullYear() - new Date(user.birth_date).getFullYear();
           } else {
               targetAge = '알수없음';
           }
           targetGender = user.gender || 'M';
        } else {
           if (!guestName || !guestAge) {
               alert(t.guestMissingInfo);
               setUploading(false);
               return;
           }
        }

        try {
            // 동적 라우팅으로 AI SDK 불러오기
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
            
            if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
            
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // [수정: 일일 분석 횟수 제한 (소프트 락)]
            // 무지성 매크로나 과도한 업로드로 인한 API 과금을 막기 위해 로컬스토리지에 하루 5회 제한을 둡니다.
            const todayStr = new Date().toISOString().split('T')[0];
            const usageInfo = JSON.parse(localStorage.getItem('ai_usage_limit') || '{}');
            if (usageInfo.date !== todayStr) {
                usageInfo.date = todayStr;
                usageInfo.count = 0;
            }
            if (usageInfo.count >= 5) {
                alert("[일일 제한 초과] 하루 최대 5회까지만 AI 분석 무료 이용이 가능합니다. 내일 다시 시도해주세요.");
                setUploading(false);
                return;
            }

            // 최신 안정 모델 사용 (SDK 버전에 맞는 gemini-2.5-flash 적용)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // [수정: 이미지 원본 압축 로직 (PDF 제외)]
            // 고해상도 이미지가 프론트엔드 메모리와 엄청난 구글 AI 토큰을 갉아먹는 것을 막기 위해 Canvas로 압축(Resize)합니다.
            const processFileForAI = (fileObj) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const isPDF = fileObj.type === 'application/pdf' || fileObj.type === 'application/haansoftpdf';
                    if (isPDF) {
                        // PDF는 브라우저 단독으로 압축하면 깨지거나 오류 날 가능성이 크므로 원본 그대로 보냅니다.
                        resolve({
                            data: reader.result.split(',')[1],
                            mimeType: 'application/pdf'
                        });
                    } else if (fileObj.type.startsWith('image/')) {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_DIMENSION = 1500; // 가로세로 최대 1500px로 제한하여 토큰 대폭 절약
                            let { width, height } = img;

                            if (width > height && width > MAX_DIMENSION) {
                                height = Math.floor(height * (MAX_DIMENSION / width));
                                width = MAX_DIMENSION;
                            } else if (height > MAX_DIMENSION) {
                                width = Math.floor(width * (MAX_DIMENSION / height));
                                height = MAX_DIMENSION;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            // 품질 80%의 JPEG로 강제 변환하여 용량(토큰) 최소화
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            resolve({
                                data: dataUrl.split(',')[1],
                                mimeType: 'image/jpeg'
                            });
                        };
                        img.onerror = () => reject(new Error("이미지 변환 중 오류 발생"));
                        img.src = reader.result;
                    } else {
                        reject(new Error("지원하지 않는 형식입니다."));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(fileObj);
            });

            const processedPart = await processFileForAI(file);
            const imagePart = { inlineData: processedPart };

            const isEn = lang === 'en';
            const systemPrompt = isEn
               ? `CareLink AI: Extract health data from image. User: ${targetAge}y, ${targetGender}. Output JSON ONLY: {healthRecord: {height,weight,waist,bpSys,bpDia,glucose,tg,hdl,ldl,ast,alt,gammaGtp,bmi}, aiReport: {summary,medicalRecommendation,riskOverview[],organStatus:{heart,liver,pancreas,abdomen,vessels},healthScore}}. Use null if missing.`
               : `CareLink AI: 건강검진 분석. 사용자: ${targetAge}세, ${targetGender}. 반드시 JSON 형식으로만 응답: {healthRecord: {height,weight,waist,bpSys,bpDia,glucose,tg,hdl,ldl,ast,alt,gammaGtp,bmi}, aiReport: {summary,medicalRecommendation,riskOverview[],organStatus:{heart,liver,pancreas,abdomen,vessels},healthScore}}. 수치 없으면 null 표시.`;

            const result = await model.generateContent([systemPrompt, imagePart]);
            const responseText = result.response.text();
            
            let data = null;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) data = JSON.parse(jsonMatch[0]);

            if (!data || !data.healthRecord) throw new Error('AI 구조 파싱 실패. 다시 시도해주세요.');

            // [수정: 정상 분석 완료 시 횟수 1 증가 저장]
            usageInfo.count += 1;
            localStorage.setItem('ai_usage_limit', JSON.stringify(usageInfo));

            const extracted = data.healthRecord || {};
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
            setAiReport(data.aiReport);
            setAnalysisDone(true);
            console.log('✅ 프론트엔드 직접 AI 분석 성공!');
        } catch (aiErr) {
            console.error('AI 분석 에러:', aiErr);
            throw new Error(`분석 실패: ${aiErr.message}`);
        }
      } else {
        // Step 2: 데이터 최종 저장
        if (!user) {
          if (window.confirm(t.guestSavePrompt)) {
            navigate('/signup', { 
              state: { 
                guestData: manualData, 
                aiReport,
                guestName,
                guestAge,
                guestGender,
                year
              } 
            });
          }
          setUploading(false);
          return;
        }

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
        alert(`[Auth Error] ${t.sessionExpired || '세션이 만료되었습니다. 다시 로그인해주세요.'}`);
        window.location.href = '/login';
      } else {
        const errorMsg = err.response?.data?.message || err.message || (t.processingError || '처리 중 오류가 발생했습니다.');
        alert(`[Error] ${errorMsg}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f0] pb-20">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to={user ? "/mypage" : "/"} className="flex items-center gap-2 text-slate-600 font-bold hover:text-teal-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> {t.back}
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600 fill-current" />
            <h1 className="text-xl font-black text-slate-900">{t.healthDataInput}</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* OCR Upload Section */}
          <section className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{t.smartUpload}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">{t.smartUploadDesc}</p>
            </div>

            <label className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center bg-white hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer group shadow-sm">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all shadow-md ${file ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-teal-500 group-hover:text-white'}`}>
                {file ? <CheckCircle2 className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
              </div>
              <p className="text-slate-900 font-bold mb-2">{file ? file.name : t.fileDragOrClick}</p>
              <p className="text-slate-400 text-sm font-medium">{t.fileTypes}</p>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="p-6 bg-white rounded-2xl border border-orange-50 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900 font-bold">
                <CheckCircle2 className="w-5 h-5 text-teal-500" /> {t.analysisProcess}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t.step1}</span>
                  <span className={analysisDone ? "text-teal-500 font-bold" : (file ? "text-orange-500 font-bold" : "text-slate-300")}>
                    {analysisDone ? t.completed : t.waiting}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">{t.step2}</span>
                  <span className={analysisDone ? "text-teal-500 font-bold" : (file ? "text-orange-500 font-bold" : "text-slate-300")}>
                    {analysisDone ? t.completed : t.waiting}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Manual Input & Review Section */}
          <section className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 mb-2">{t.dataInputTitle}</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                {t.dataInputDesc}
              </p>
            </div>

            {analysisDone && aiReport && (
              <div className="bg-teal-50 border border-teal-100 p-6 rounded-3xl shadow-sm text-sm">
                <h3 className="text-teal-800 font-black flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5" /> {t.aiSummaryTitle}
                </h3>
                <p className="text-teal-700 leading-relaxed font-medium">{aiReport.summary}</p>
              </div>
            )}

            {!user && !analysisDone && (
              <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-orange-500 fill-current" /> {t.guestInfoTitle}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-2">{t.guestInfoDesc}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.name}</label>
                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={t.namePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.age}</label>
                    <input type="number" className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={guestAge} onChange={e => setGuestAge(e.target.value)} placeholder={t.agePlaceholder} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.gender}</label>
                    <select className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={guestGender} onChange={e => setGuestGender(e.target.value)}>
                      <option value="M">{t.male}</option>
                      <option value="F">{t.female}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.examYear}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 shadow-inner" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.height || "신장 (cm)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.height} onChange={(e) => setManualData({ ...manualData, height: e.target.value })} placeholder="예: 170" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.weight || "체중 (kg)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.weight} onChange={(e) => setManualData({ ...manualData, weight: e.target.value })} placeholder="예: 70" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.waist || "허리둘레 (cm)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.waist} onChange={(e) => setManualData({ ...manualData, waist: e.target.value })} placeholder="예: 85" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.bpSys || "수축기 혈압 (mmHg)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.bpSys} onChange={(e) => setManualData({ ...manualData, bpSys: e.target.value })} placeholder="예: 120" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.bpDia || "이완기 혈압 (mmHg)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.bpDia} onChange={(e) => setManualData({ ...manualData, bpDia: e.target.value })} placeholder="예: 80" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.glucose || "공복 혈당"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.glucose} onChange={(e) => setManualData({ ...manualData, glucose: e.target.value })} placeholder="예: 95" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.tg || "중성 지방 (mg/dL)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.tg} onChange={(e) => setManualData({ ...manualData, tg: e.target.value })} placeholder="예: 140" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.hdl || "HDL 콜레스테롤 (mg/dL)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.hdl} onChange={(e) => setManualData({ ...manualData, hdl: e.target.value })} placeholder="예: 50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.ldl || "LDL 콜레스테롤 (mg/dL)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.ldl} onChange={(e) => setManualData({ ...manualData, ldl: e.target.value })} placeholder="예: 130" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.ast || "AST (U/L)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.ast} onChange={(e) => setManualData({ ...manualData, ast: e.target.value })} placeholder="예: 30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.alt || "ALT (U/L)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.alt} onChange={(e) => setManualData({ ...manualData, alt: e.target.value })} placeholder="예: 30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.gammaGtp || "감마 GTP (U/L)"}</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.gammaGtp} onChange={(e) => setManualData({ ...manualData, gammaGtp: e.target.value })} placeholder="예: 40" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  {file && !analysisDone ? t.startAiBtn : t.saveBtn}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
