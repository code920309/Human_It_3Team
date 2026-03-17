import { useLocation, Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Policy() {

  const location = useLocation();

  const activeTab = location.pathname.includes("privacy")
    ? "privacy"
    : "terms";

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Navigation */}
      <nav className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2">
          <Heart className="w-8 h-8 text-teal-600 fill-current" />
          <Link to="/" className="text-2xl font-extrabold text-teal-600">
            CareLink
          </Link>
        </div>
      </nav>


      {/* Main Policy Area */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h1 className="text-3xl font-bold text-slate-900 mb-10">
            약관 및 정책
          </h1>
          <div className="flex border-b border-slate-200 mb-12">

            <Link
              to="/policy/terms"
              className={`px-8 py-4 font-semibold border-b-4 transition
              ${
                activeTab === "terms"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-teal-600"
              }`}
            >
              이용약관
            </Link>
            <Link
              to="/policy/privacy"
              className={`px-8 py-4 font-semibold border-b-4 transition
              ${
                activeTab === "privacy"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-teal-600"
              }`}
            >
              개인정보처리방침
            </Link>
          </div>
          <div className="policy-content w-full">

            {activeTab === "terms" && (
              <div className="text-slate-700 leading-relaxed text-[15px] space-y-6">
                <h2 className="text-xl font-bold">
                  CareLink 이용약관
                </h2>
                <p>
                  이곳에 이용약관 내용이 들어갑니다.
                </p>
                <p>
                  실제 약관은 이후 추가될 예정입니다.
                </p>
              </div>
            )}
            {activeTab === "privacy" && (
              <div className="text-slate-700 leading-relaxed text-[15px] space-y-6">
                <h2 className="text-xl font-bold">
                  개인정보 처리방침
                </h2>
                <p>
                  이곳에 개인정보처리방침 내용이 들어갑니다.
                </p>
                <p>
                  실제 정책 내용은 이후 추가될 예정입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 text-slate-800 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-400">
          © Copyright 2026 CareLink Healthcare - All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
