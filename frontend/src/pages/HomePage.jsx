import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Heart, Star, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

/* MERGED FROM 업로드OCR: 다국어 지원 및 레이아웃 최적화 */

export default function HomePage() {
  const { user, logout } = useAuth();
  const { lang, t, toggleLang } = useLanguage();
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
          const response = await api.get(`/reviews/check?email=${user.email}`);
          const data = response.data;

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
    e.preventDefault();
    if (!email || !message) {
      alert(t.contactValidation || '이메일과 메시지를 모두 입력해주세요.');
      return;
    }
    try {
      const response = await api.post('/contacts', { email, message });
      if (response.data.success || response.status === 200 || response.status === 201) {
        alert(t.contactSuccess || '소중한 의견이 전달되었습니다!');
        setEmail('');
        setMessage('');
      } else {
        alert(t.contactFail || '전송에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('에러 발생:', error);
      alert(t.contactError || '서버와 연결할 수 없습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors font-semibold px-4 py-2 rounded-full hover:bg-slate-50 border border-slate-100"
              >
                <Languages className="w-4 h-4" />
                {lang === 'ko' ? 'English' : '한국어'}
              </button>

              {isAuthenticated ? (
                <>
                  <Link to="/mypage" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">{t.mypage}</Link>
                  <button
                    onClick={logout}
                    className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all shadow-md"
                  >
                    {t.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-600 hover:text-teal-600 transition-colors font-semibold">{t.login}</Link>
                  <Link to="/upload" className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition-all shadow-md">
                    {t.signup}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

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
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">CareLink</h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">{t.slide1_desc}</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://69b57d62d7351016cf21b33e.imgix.net/download/markus-spiske-XrIfY_4cK1w-unsplash.jpg?w=3500&h=2333')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-6xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">{t.slide2_title}</h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">{t.slide2_desc}</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1581595219315-a187dd40c322?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">{t.slide3_title}</h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">{t.slide3_desc}</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">{t.slide4_title}</h1>
                <p className="text-lg md:text-xl text-slate-100 max-w-5xl mx-auto">{t.slide4_desc}</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="relative h-full flex items-center justify-center text-white bg-[url('https://69b57d62d7351016cf21b33e.imgix.net/pexels-karola-g-5206922.jpg?w=6720&h=4480')] bg-cover bg-center">
              <div className="absolute inset-0 bg-slate-900/60" />
              <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6">{t.slide5_title}</h1>
                <p className="text-lg md:text-xl text-slate-100 mb-10 max-w-5xl mx-auto">{t.slide5_desc}</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    to="/upload"
                    className="bg-teal-500 text-white px-8 py-4 rounded-full font-bold hover:bg-teal-600 transition-all shadow-lg"
                  >
                    {t.startAnalysis}
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>

      <section className="py-24 bg-[#f9f7f0]">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{t.reviewTitle}</h2>
            <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {t.reviews.map((defaultReview, i) => {
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
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">CareLink 서비스는 어떠셨나요?</h2>
            <p className="text-slate-500 text-center mb-6">소중한 리뷰를 남겨주시면 서비스 개선에 큰 힘이 됩니다.</p>
            <div className="flex justify-center gap-2 mb-6 cursor-pointer">
              {[1, 2, 3, 4, 5].map((starValue) => (
                <Star
                  key={starValue}
                  onClick={() => setRating(starValue)}
                  className={`w-10 h-10 transition-colors cursor-pointer ${starValue <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                />
              ))}
            </div>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 focus:ring-2 focus:ring-teal-500 outline-none resize-none h-32"
              placeholder="여기에 솔직한 후기를 남겨주세요..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-lg transition-colors">나중에 하기</button>
              <button onClick={handleReviewSubmit} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-lg transition-colors shadow-md">등록하기</button>
            </div>
          </div>
        </div>
      )}

      <section className="py-24 bg-white">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">{t.videoTitle}</h2>
            <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="w-full max-w-5xl mx-auto">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/i5qxRcJus6I?si=mH8GRc4Bk8H9FLO_"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
            <div>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed whitespace-pre-wrap">{t.videoDesc}</p>
              <ul className="space-y-4 text-slate-700 font-medium">
                <li>{t.videoFeature1}</li>
                <li>{t.videoFeature2}</li>
                <li>{t.videoFeature3}</li>
              </ul>
              <Link
                to={isAuthenticated ? "/upload" : "/login"}
                className="inline-flex items-center mt-8 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-md"
              >
                {t.customAnalysis}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-orange-100 text-slate-800 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 mb-12 gap-12">
            <div>
              <div className="flex items-center gap-2 text-3xl font-extrabold mb-6 text-teal-600">
                <Heart className="w-10 h-10 fill-current" /> CareLink
              </div>
              <div className="space-y-4 text-slate-500 text-sm font-medium">
                <p>{t.companyName}</p>
                <p>{t.address}</p>
                <p>{t.contactInfo}</p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold mb-8 text-slate-900">{t.contactTitle}</h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-4 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder={t.emailPlaceholder}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 px-4 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder={t.messagePlaceholder}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-4 rounded-lg shadow-lg transition-all transform hover:-translate-y-1"
                >
                  {t.sendBtn}
                </button>
              </form>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-3 text-slate-400 text-sm font-medium">
            <div className="flex gap-6">
              <Link to="/policy/terms" className="hover:text-teal-600 transition-colors">{t.terms}</Link>
              <Link to="/policy/privacy" className="hover:text-teal-600 transition-colors">{t.privacy}</Link>
            </div>
            <p>{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
