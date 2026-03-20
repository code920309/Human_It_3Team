import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyPage from './pages/MyPage';
import UploadPage from './pages/UploadPage';
import ChatbotPage from './pages/ChatbotPage';
import ActionPlanPage from './pages/ActionPlanPage';
import HealthReport from './pages/HealthReport';
import ProfileEdit from './pages/ProfileEdit';
import ProtectedRoute from './components/ProtectedRoute';
import Policy from "./pages/Policy";
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/mypage" element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <HealthReport />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/chatbot" element={
              <ProtectedRoute>
                <ChatbotPage />
              </ProtectedRoute>
            } />
            <Route path="/action-plan" element={
              <ProtectedRoute>
                <ActionPlanPage />
              </ProtectedRoute>
            } />
            <Route path="/policy/terms" element={<Policy />} />
            <Route path="/policy/privacy" element={<Policy />} />
          </Routes>
          <ChatWidget />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
