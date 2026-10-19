import GoogleSignInSection from '../components/GoogleSignInSection';
import { GOOGLE_LOGIN_ENABLED } from '../config/api';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { googleLoginAPI, signIn } from '../api/auth';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';

function getLoginErrorMessage(error) {
  const serverMsg = error.response?.data?.msg;

  if (!error.response) {
    return 'לא ניתן להתחבר לשרת. ודאו שהשרת רץ ונסו שוב.';
  }

  if (serverMsg === 'User not found with password. Did you sign up with Google?') {
    return GOOGLE_LOGIN_ENABLED
      ? 'החשבון נוצר עם Google. לחצו על "התחבר עם Google" או השתמשו באפשרות "שכחת סיסמה?" אם נרשמתם עם מייל.'
      : 'החשבון נוצר עם Google, וההתחברות עם Google לא זמינה כרגע. אפשר לפנות אלינו ונעזור להתחבר.';
  }

  if (serverMsg === 'User or password not match') {
    return 'האימייל או הסיסמה שגויים. בדקו את הפרטים ונסו שוב, או לחצו על "שכחת סיסמה?" לאיפוס.';
  }

  if (error.response.status >= 500) {
    return 'אירעה שגיאה בשרת. נסו שוב בעוד כמה רגעים.';
  }

  return serverMsg || 'ההתחברות נכשלה. בדקו את הפרטים ונסו שוב.';
}

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
        alert(getLoginErrorMessage(error));
      });
  };

  const googleHandlers = {
    onSuccess: async (tokenResponse) => {
      try {
        const response = await googleLoginAPI(tokenResponse.access_token);
        const { user } = response.data;
        login(user);

        if (user?._id) {
          try {
            await loadCart(user._id);
          } catch (err) {
            console.error("Failed to load cart:", err);
          }
        }

        Navigate(from);
      } catch (error) {
        console.error("Google Login Error:", error);
        alert(error.response?.data?.msg || 'הכניסה נכשלה. אנא בדוק את הפרטים ונסה שוב.');
      }
    },
    onError: () => {
      alert("הכניסה נכשלה. אנא בדוק את הפרטים ונסה שוב.");
    }
  };

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

        <GoogleSignInSection label="התחבר עם Google" {...googleHandlers} />

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