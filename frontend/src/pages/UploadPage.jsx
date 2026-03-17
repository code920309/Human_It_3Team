import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Heart, ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [manualData, setManualData] = useState({
    height: 170, weight: 70, waist: 85, bpSys: 120, bpDia: 80, glucose: 95, tg: 140, hdl: 50, ldl: 120, ast: 30, alt: 30, gammaGtp: 30
  });
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('report', file);
        formData.append('year', year);
      }
      
      const res = await api.post('/reports/upload', 
        file ? formData : { ...manualData, year }, 
        {
          headers: { 
            'Content-Type': file ? 'multipart/form-data' : 'application/json'
          }
        }
      );

      if (res.data.success) {
        navigate('/mypage');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('업로드에 실패했습니다. 다시 시도해주세요.');
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
                  <span className={file ? "text-teal-500 font-bold" : "text-slate-300"}>{file ? "준비완료" : "대기 중"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">2. Gemini 1.5 Flash 지표 분석</span>
                  <span className={file ? "text-teal-500 font-bold" : "text-slate-300"}>{file ? "준비완료" : "대기 중"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Manual Input Section */}
          <section className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black text-slate-900 mb-2">데이터 확인 및 입력</h2>
              <p className="text-slate-500 font-medium leading-relaxed">추출된 수치를 확인하거나 직접 정보를 <br />입력하여 건강 분석을 시작하세요.</p>
            </div>

            <form onSubmit={handleUploadSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">검진 연도</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 shadow-inner" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">신장 (cm)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.height} onChange={(e) => setManualData({...manualData, height: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">체중 (kg)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.weight} onChange={(e) => setManualData({...manualData, weight: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">공복 혈당</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.glucose} onChange={(e) => setManualData({...manualData, glucose: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">중성 지방</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-600" value={manualData.tg} onChange={(e) => setManualData({...manualData, tg: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={uploading || (!file && !manualData.glucose)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  {file ? "AI 분석 시작하기" : "데이터 저장 및 분석"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
