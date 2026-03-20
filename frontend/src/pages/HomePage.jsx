import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Heart, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false); // 리뷰 팝업 상태
  const [rating, setRating] = useState(0); // 선택된 별점
  const [reviewText, setReviewText] = useState(''); // 작성된 리뷰 내용
  const [publicReviews, setPublicReviews] = useState([]); // 화면에 노출할 승인된 리뷰 리스트

  // 화면 진입 시 승인된 공개 리뷰 데이터 4개를 가져옵니다.
  useEffect(() => {
    const fetchPublicReviews = async () => {
      try {
        const response = await api.get('/reviews/public');
        if (response.data.success) {
          setPublicReviews(response.data.reviews);
        }
      } catch (error) {
        console.error("공개 리뷰 불러오기 실패:", error);
      }
    };
    fetchPublicReviews();
  }, []);

  // 로그인 상태일 때 임시로 팝업 띄우기 (페이지 진입 0.5초 후)
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (isAuthenticated && user) {
        try {
          // 1. 해당 사용자의 이메일을 기반으로 DB에 리뷰가 있는지 백엔드에 물어봅니다.
          const response = await api.get(`/reviews/check?email=${user.email}`);
          const data = response.data;

          // 2. 백엔드에서 '아직 리뷰를 비작성함(!hasReviewed)' 응답이 오면 팝업을 띄웁니다.
          if (data.success && !data.hasReviewed) {
            const timer = setTimeout(() => {
              setShowReviewModal(true);
            }, 500);
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error("리뷰 작성 상태 확인 중 에러 발생:", error);
        }
      }
    };

    checkReviewStatus();
  }, [isAuthenticated, user]);

  // 리뷰 제출 함수 (백엔드 DB 전송)
  const handleReviewSubmit = async () => {
    if (rating === 0) {
      alert("별점을 선택해주세요!");
      return;
    }
    if (reviewText.trim() === '') {
      alert("리뷰 내용을 입력해주세요!");
      return;
    }

    try {
      // 3. 백엔드 서버로 데이터를 POST 전송합니다.
      const response = await api.post('/reviews', {
        email: user?.email,
        name: user?.name,
        rating: rating,
        review_text: reviewText
      });

      if (response.data.success || response.status === 201 || response.status === 200) {
        alert("소중한 리뷰가 등록되었습니다!");
        setShowReviewModal(false);
        setRating(0);
        setReviewText('');
      } else {
        alert("리뷰 등록에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error('리뷰 서버 전송 에러 발생:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // 페이지 새로고침 방지
    if (!email || !message) {
      alert('이메일과 메시지를 모두 입력해주세요.');
      return;
    }
    try {
      const response = await api.post('/contacts', { email, message });
      if (response.data.success || response.status === 200 || response.status === 201) {
        alert('소중한 의견이 전달되었습니다!');
        setEmail('');
        setMessage('');
      } else {
        alert('전송에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('에러 발생:', error);
      alert('서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-extrabold text-teal-600 flex items-center gap-2">
                <Heart className="w-8 h-8 fill-current" />
                CareLink
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link to="/mypage" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">마이페이지</Link>
                  <button
                    onClick={logout}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all shadow-md"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">로그인</Link>
                  <Link to="/upload" className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all shadow-md">
                    시작하기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Slider */}
      <section className="relative h-[600px]">
        <Swiper
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{ delay: 8000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Autoplay, Pagination, Navigation]}
          className="h-[600px]"
        >
          {/* Slide 1 - 서비스 소개 */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                  CareLink
                </h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">
                  <br /> CareLink는 건강검진 데이터를 분석하여
                  사용자가 자신의 건강 상태를 쉽게 이해하고 <br />
                  지속적으로 관리할 수 있도록 돕는 스마트 헬스케어 서비스입니다.
                </p>
              </div>
            </div>
          </SwiperSlide>
          {/* Slide 2 - 문제 제기 */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://69b57d62d7351016cf21b33e.imgix.net/download/markus-spiske-XrIfY_4cK1w-unsplash.jpg?w=3500&h=2333')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-6xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                  건강검진 결과, 제대로 이해하고 계신가요?
                </h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">
                  <br /> 건강검진 결과표는 대부분 전문 의학 용어와 수치 중심으로 작성되어 <br />
                  일반 사용자가 자신의 건강 상태를 정확히 이해하기 어렵습니다. <br /><br />
                  그 결과 관리가 필요한 신호를 놓치기도 합니다.
                </p>
              </div>
            </div>
          </SwiperSlide>
          {/* Slide 3 - AI 분석 */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1581595219315-a187dd40c322?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                  AI가 건강 데이터를 분석합니다
                </h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">
                  <br /> CareLink는 건강검진 데이터를 AI로 분석하여
                  대사증후군 주요 지표와 건강 위험 요소를 파악하고 <br />
                  사용자가 이해하기 쉬운 형태로 건강 상태를 설명합니다.
                </p>
              </div>
            </div>
          </SwiperSlide>
          {/* Slide 4 - 맞춤 관리 */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                  당신에게 맞는 건강 관리 방법
                </h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">
                  <br /> CareLink는 개인의 건강 데이터를 기반으로
                  맞춤형 식단, 운동, 생활습관 개선 가이드를 제공합니다. <br /><br />
                  지속적인 건강 관리와 변화를 함께 만들어갑니다.
                </p>
              </div>
            </div>
          </SwiperSlide>
          {/* Slide 5 - 서비스 시작 */}
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://69b57d62d7351016cf21b33e.imgix.net/pexels-karola-g-5206922.jpg?w=6720&h=4480')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
                  지금 나의 건강 상태를 확인해보세요
                </h1>
                <p className="text-lg md:text-xl text-slate-100 mb-10 max-w-5xl mx-auto">
                  <br /> 건강검진 결과를 업로드하면
                  AI가 건강 상태를 분석하고 맞춤형 건강 관리 가이드를 제공합니다. <br />
                  지금 CareLink와 함께 건강 관리를 시작해보세요.
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    to="/upload"
                    className="bg-teal-500 text-white px-8 py-4 rounded-full font-bold hover:bg-teal-600 transition-all shadow-lg"
                  >
                    건강 분석 시작하기
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      {/* Reviews */}
      <section className="py-24 bg-[#f9f7f0]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">사용자 후기</h2>
            <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "김OO", text: "드디어 건강검진 결과를 이해했어요! AI의 설명이 정말 명확하고 도움이 되었습니다.", rating: 5 },
              { name: "이XX", text: "인터페이스가 현대적이고 사용하기 쉽네요. 모든 분들께 강력히 추천합니다.", rating: 5 },
              { name: "박YY", text: "더 이상 의학 용어를 검색할 필요가 없어요. CareLink가 즉시 모든 것을 해결해 줍니다.", rating: 5 },
              { name: "최ZZ", text: "내 건강 관리에 더 자신감이 생겼어요. 정말 혁신적인 도구입니다.", rating: 5 }
            ].map((defaultReview, i) => {
              // 백엔드에서 가져온 진짜 리뷰가 해당 인덱스(i)에 있으면 덮어씌움. 이름은 무조건 '익명'
              const reviewData = publicReviews[i] 
                ? { name: "익명", text: publicReviews[i].content, rating: publicReviews[i].rating }
                : defaultReview;
                
              return (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-orange-50 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 mb-4">
                      {[1, 2, 3, 4, 5].map((starValue) => (
                        <Star 
                          key={starValue} 
                          className={`w-4 h-4 ${starValue <= reviewData.rating ? 'fill-current' : 'fill-transparent text-slate-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-slate-600 mb-6 italic leading-relaxed">"{reviewData.text}"</p>
                  </div>
                  <p className="font-extrabold text-slate-900">- {reviewData.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">
              CareLink 서비스는 어떠셨나요?
            </h2>
            <p className="text-slate-500 text-center mb-6">
              소중한 리뷰를 남겨주시면 서비스 개선에 큰 힘이 됩니다.
            </p>

            {/* 별점 선택 영역 */}
            <div className="flex justify-center gap-2 mb-6 cursor-pointer">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={starValue}
                  onClick={() => setRating(starValue)}
                  className={`w-10 h-10 transition-colors cursor-pointer ${starValue <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"
                    }`}
                />
              ))}
            </div>

            {/* 리뷰 입력 영역 */}
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 focus:ring-2 focus:ring-teal-500 outline-none resize-none h-32"
              placeholder="여기에 솔직한 후기를 남겨주세요..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors"
              >
                나중에 하기
              </button>
              <button
                onClick={handleReviewSubmit}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video */}
      <section className="py-24 bg-white">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              오늘의 건강 인사이트
            </h2>
            <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Video */}
            <div className="w-full max-w-5xl mx-auto">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/i5qxRcJus6I?si=Cbus_MC5Ech5uWSi"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
            <div>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                건강은 작은 생활 습관에서 시작됩니다.
                영상에서 소개하는 건강 관리 방법을 확인하고,
                CareLink에서 제공하는 개인 맞춤 건강 관리 팁도 함께 확인해보세요.
              </p>
              <ul className="space-y-4 text-slate-700 font-medium">
                <li>✓ 건강검진 데이터 기반 건강 분석</li>
                <li>✓ 개인 맞춤형 영양 가이드</li>
                <li>✓ 생활습관 개선 추천</li>
              </ul>
              <Link
                to={isAuthenticated ? "/upload" : "/login"}
                className="inline-flex items-center mt-8 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-md"
              >
                맞춤형 분석 해보기 &gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 text-slate-800 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 mb-12 gap-12">
            <div>
              <div className="flex items-center gap-2 text-3xl font-extrabold mb-6 text-teal-600">
                <Heart className="w-10 h-10 fill-current" />
                CareLink
              </div>
              <div className="space-y-4 text-slate-500 text-sm font-medium">
                <p>(주)케어링크 헬스케어 서비스</p>
                <p>경기 수원시 팔달구 중부대로 100 4층</p>
                <p>전화: 02-1234-5678 | 이메일: support@carelink.health</p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold mb-8 text-slate-900">문의하기</h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-4 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // 입력값 연결
                />
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-4 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="메시지"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)} // 입력값 연결
                ></textarea>
                <button
                  type="submit" // button -> submit으로 변경
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1"
                >
                  메시지 보내기
                </button>
              </form>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-3 text-slate-400 text-sm font-medium">
            <div className="flex gap-6">
              <Link to="/policy/terms" className="hover:text-teal-600 transition-colors">
                이용약관
              </Link>
              <Link to="/policy/privacy" className="hover:text-teal-600 transition-colors">
                개인정보처리방침
              </Link>
            </div>
            <p>© Copyright 2026 CareLink Healthcare - All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
