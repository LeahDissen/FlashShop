import { useState } from 'react';
import { googleLoginAPI, signIn } from '../api/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const Navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const loadCart = useCartStore(state => state.loadCart);
  const from = location.state?.from || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) {
      newErrors.email = 'מייל הוא שדה חובה';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'כתובת מייל אינה תקינה';
    }

    if (!password) {
      newErrors.password = 'סיסמה הוא שדה חובה';
    } else if (password.length < 6) {
      newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    signIn(email, password)
      .then(async (response) => {
        const { user } = response.data;
        login(user);
        
        if (user && user._id) {
            try {
                await loadCart(user._id);
            } catch (err) {
                console.error("Failed to load cart:", err);
            }
        }
        Navigate(from);
      })
      .catch((error) => {
        console.log(error);
        alert('Login failed. Please check your credentials and try again.');
      });
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleLoginAPI(tokenResponse.access_token);
        localStorage.setItem("token", response.data.token);
        Navigate('/about');
      } catch (error) {
        console.error("Google Login Error:", error);
        alert(error.response?.data?.msg || 'הכניסה נכשלה. אנא בדוק את הפרטים ונסה שוב.');
      }
    },
    onError: () => {
      alert("הכניסה נכשלה. אנא בדוק את הפרטים ונסה שוב.");
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-[#f2665e] to-[#e1574f]">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-10 w-full max-w-md animate-[slideUp_0.5s_ease-out]">
        
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Logo Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-br from-[#f2665e] to-[#e1574f]">
            ברוכים הבאים
          </h1>
          <p className="text-gray-500 text-sm font-sans">
            אנא הכנס את הפרטים שלך
          </p>
        </div>

        {/* Login Form */}
        <div className="mb-6">
          <div className="mb-6">
            <label 
              htmlFor="email" 
              className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
            >
              כתובת מייל
            </label>
            <input
              type="email"
              id="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full p-3.5 border-2 rounded-xl text-[15px] font-sans outline-none transition-all duration-300 text-right
                ${errors.email ? 'border-red-500' : 'border-gray-200'}
                focus:border-[#f2665e] focus:shadow-[0_0_0_4px_rgba(242,102,94,0.1)]`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 font-sans text-right">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label 
              htmlFor="password" 
              className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
            >
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              dir="rtl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`w-full p-3.5 border-2 rounded-xl text-[15px] font-sans outline-none transition-all duration-300 text-right
                ${errors.password ? 'border-red-500' : 'border-gray-200'}
                focus:border-[#f2665e] focus:shadow-[0_0_0_4px_rgba(242,102,94,0.1)]`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 font-sans text-right">
                {errors.password}
              </p>
            )}
          </div>

          <div className="text-right mb-6">
            <a
              href="/forgot"
              style={{ color: '#f2665e' }}
              className="!text-[#f2665e] text-[13px] font-sans transition-colors duration-300 hover:!text-[#e1574f]"
              onMouseEnter={(e) => e.target.style.color = '#e1574f'}
              onMouseLeave={(e) => e.target.style.color = '#f2665e'}
            >
              שכחת סיסמה ?
            </a>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full p-4 bg-gradient-to-br from-[#f2665e] to-[#e1574f] text-white border-none rounded-xl text-base font-semibold font-sans cursor-pointer shadow-[0_4px_15px_rgba(242,102,94,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,102,94,0.5)]"
          >
            התחבר
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-8 text-center">
          <div className="absolute left-0 top-1/2 w-full h-px bg-gray-200"></div>
          <span className="relative bg-white px-4 text-gray-400 text-[13px] font-sans">
            או
          </span>
        </div>

        {/* Social Login */}
        <div className="mb-8">
          <button
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-xl bg-white cursor-pointer text-sm font-medium font-sans transition-all duration-300 hover:border-[#f2665e] hover:-translate-y-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            <span>התחבר עם Google</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-500 font-sans">
          אין לך חשבון?{' '}
          <a
            href="/signup"
            style={{ color: '#f2665e' }}
            className="!text-[#f2665e] font-semibold no-underline transition-colors duration-300 hover:!text-[#e1574f]"
            onMouseEnter={(e) => e.target.style.color = '#e1574f'}
            onMouseLeave={(e) => e.target.style.color = '#f2665e'}
          >
            הרשם
          </a>
        </div>
      </div>
    </div>
  );
}