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
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="mx-auto px-6 py-4 flex items-center gap-2">
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
              ${activeTab === "terms"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-teal-600"
                }`}
            >
              이용약관
            </Link>
            <Link
              to="/policy/privacy"
              className={`px-8 py-4 font-semibold border-b-4 transition
              ${activeTab === "privacy"
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
                  여기에 이용약관 내용이 들어갑니다.
                </p>
                <p>
                  실제 약관은 이후 추가될 예정입니다.
                </p>
              </div>
            )}
            {/*
            {activeTab === "terms" && (
              <div className="text-slate-700 leading-relaxed text-[15px] space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    CareLink 이용약관 (Terms of Service)
                  </h2>
                  <p className="text-slate-500 text-sm">마지막 업데이트: 2026.03.15</p>
                </div>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">1. 서비스 이용 조건 (Acceptance of Terms)</h3>
                  <p>CareLink(이하 “서비스”)를 이용함으로써 귀하는 본 이용약관에 동의하는 것으로 간주됩니다. 약관에 동의하지 않으시면 서비스를 이용할 수 없습니다. 서비스는 예고 없이 변경될 수 있으며, 변경 후에도 서비스를 이용하면 변경 사항에 동의한 것으로 간주됩니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">2. 계정 및 회원 관리 (Accounts & Registration)</h3>
                  <p>회원가입 시 정확하고 최신의 정보를 제공해야 합니다. 계정 정보 및 비밀번호 관리 책임은 사용자에게 있습니다. 부정한 방법으로 서비스를 이용하거나 타인 계정을 도용할 경우 계정이 정지될 수 있습니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">3. 서비스 제공 범위 (Service Description)</h3>
                  <p>CareLink는 건강검진 결과를 AI(Gemini API)로 분석하여 사용자가 이해하기 쉬운 언어로 건강 상태를 설명하고, 개인 맞춤 건강 관리 솔루션을 제공합니다.</p>
                  <p className="mt-2 font-semibold text-teal-700">AI 분석 결과는 참고용 정보이며, 의료 진단이나 치료를 대신하지 않습니다.</p>
                  <p className="mt-1">일부 기능은 회원가입 및 로그인 후 이용 가능합니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">4. 사용자 의무 (User Responsibilities)</h3>
                  <p>본인이 소유한 건강 정보를 정확히 업로드해야 합니다. 타인의 건강 정보 업로드, 불법 콘텐츠, 악의적 사용을 금지합니다. 서비스 이용 시 다른 사용자 또는 제3자의 권리를 침해하지 않아야 합니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">5. 지적재산권 (Intellectual Property)</h3>
                  <p>CareLink의 웹사이트, 로고, UI, AI 알고리즘, 콘텐츠 등 모든 지적재산권은 회사에 귀속됩니다. 사용자는 명시적 허가 없이 복제, 배포, 수정, 상업적 사용을 할 수 없습니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">6. 데이터 및 개인정보 (Data & Privacy)</h3>
                  <p>CareLink는 건강 데이터, 검진 기록, 활동 정보 등 민감한 정보를 취급합니다. 사용자의 데이터는 암호화 및 보안 조치를 통해 안전하게 처리됩니다. 데이터는 서비스 제공, 통계 분석, 연구 목적으로 활용될 수 있으며, 제3자 제공 시 반드시 익명화 처리하거나 사용자의 동의를 받습니다. 자세한 개인정보 처리 방침은 별도 [Privacy Policy] 페이지를 참조하십시오.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">7. 면책 조항 (Disclaimers / Limitation of Liability)</h3>
                  <p>AI 분석 결과의 정확성을 보장하지 않으며, 건강 상태에 따른 결과 책임은 사용자에게 있습니다. CareLink는 서비스 이용 중 발생한 손실, 부상, 건강 악화 등에 대해 법적 책임을 지지 않습니다. 천재지변, 네트워크 장애 등 불가항력으로 인한 서비스 중단에 대해서도 책임을 지지 않습니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">8. 서비스 중단 및 변경 (Termination / Modifications)</h3>
                  <p>회사는 필요에 따라 서비스를 중단, 변경, 제한할 수 있습니다. 계정 정지, 서비스 종료 시 사용자는 별도의 통지를 받을 수 있습니다. 약관 변경 시 웹사이트 공지 또는 이메일 안내 후 적용됩니다.</p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">9. 준거법 및 분쟁 해결 (Governing Law / Dispute Resolution)</h3>
                  <p>본 약관은 대한민국 법령을 준거법으로 합니다. 서비스 이용과 관련한 분쟁은 서울중앙지방법원을 1심 관할 법원으로 합니다.</p>
                </section>
              </div>
            )}
            */}
            {activeTab === "privacy" && (
              <div className="text-slate-700 leading-relaxed text-[15px] space-y-6">
                <h2 className="text-xl font-bold">
                  개인정보 처리방침
                </h2>
                <p>
                  여기에 개인정보처리방침 내용이 들어갑니다.
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