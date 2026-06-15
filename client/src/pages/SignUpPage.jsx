import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleLoginAPI, signUp } from '../api/auth';
import { joinClubRequest } from '../api/club';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function SignUpPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});    
    const [joinClub, setJoinClub] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const Navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const loadCart = useCartStore((state) => state.loadCart);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.fullName) {
            newErrors.fullName = 'שם מלא הוא שדה חובה';
        } else if (formData.fullName.length < 2) {
            newErrors.fullName = 'שם מלא חייב להכיל לפחות 2 תווים';
        }

        if (!formData.email) {
            newErrors.email = 'כתובת אימייל היא שדה חובה';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'כתובת אימייל אינה תקינה';
        }

        if (!formData.password) {
            newErrors.password = 'סיסמה היא שדה חובה';
        } else if (formData.password.length < 6) {
            newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'יש להזין את הסיסמה שוב';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        signUp(formData.fullName, formData.email, formData.password)
            .then(async (response) => {
                if (joinClub) {
                    try {
                        const newUser = response.data;

                        await joinClubRequest({
                            user_id: newUser._id,
                            email: formData.email,
                            name: formData.fullName,
                        });
                        console.log("User automatically added to club");
                    } catch (clubError) {
                        console.error('Failed to join club automatically:', clubError);
                    }
                }
                alert('החשבון נוצר בהצלחה! עכשיו אפשר להתחבר.');
                setFormData({
                    fullName: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                Navigate('/login');
            })
            .catch(error => {
                console.error('Error creating account:', error);
                const serverMsg = error.response?.data?.msg;
                if (error.response?.status === 409) {
                    alert(serverMsg || 'כתובת האימייל כבר רשומה. נסי להתחבר.');
                    Navigate('/login');
                    return;
                }
                if (error.response?.status === 429 || error.response?.data?.message?.includes?.('Too many')) {
                    alert('יותר מדי ניסיונות. המתיני דקה ונסי שוב.');
                    return;
                }
                if (error.code === 'ERR_NETWORK' || !error.response) {
                    alert('לא ניתן להתחבר לשרת. ודאי שהשרת רץ (פורט 5000) ונסי שוב.');
                    return;
                }
                alert(serverMsg || error.response?.data?.details?.[0]?.message || 'יצירת החשבון נכשלה. אנא נסי שוב.');
            });
    };

    const loginWithGoogle = useGoogleLogin({
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

                Navigate('/home');
            } catch (error) {
                alert(error.response?.data?.msg || 'החיבור עם Google נכשל. אנא נסה שוב.');
            }
        },
        onError: () => {
            console.log('Google Login Failed');
            alert('החיבור עם Google נכשל. אנא נסה שוב.');
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
                        הרשמה
                    </h1>
                    <p className="text-gray-500 text-sm font-sans">
                        הרשם כדי להתחיל
                    </p>
                </div>

                {/* Sign Up Form */}
                <div className="mb-6">
                    <div className="mb-5">
                        <label 
                            htmlFor="fullName" 
                            className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
                        >
                            שם מלא
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            dir="rtl"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="אברם אברמוביץ"
                            className={`w-full p-3.5 border-2 rounded-xl text-[15px] font-sans outline-none transition-all duration-300 text-right
                                ${errors.fullName ? 'border-red-500' : 'border-gray-200'}
                                focus:border-[#f2665e] focus:shadow-[0_0_0_4px_rgba(242,102,94,0.1)]`}
                        />
                        {errors.fullName && (
                            <p className="text-red-500 text-xs mt-1 font-sans text-right">
                                {errors.fullName}
                            </p>
                        )}
                    </div>

                    <div className="mb-5">
                        <label 
                            htmlFor="email" 
                            className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
                        >
                            כתובת אימייל
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            dir="ltr"
                            value={formData.email}
                            onChange={handleChange}
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

                    <div className="mb-5">
                        <label 
                            htmlFor="password" 
                            className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
                        >
                            סיסמה
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            dir="rtl"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
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

                    <div className="mb-6">
                        <label 
                            htmlFor="confirmPassword" 
                            className="block mb-2 text-gray-800 font-medium text-sm font-sans text-right"
                        >
                            ודא סיסמה
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            dir="rtl"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className={`w-full p-3.5 border-2 rounded-xl text-[15px] font-sans outline-none transition-all duration-300 text-right
                                ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}
                                focus:border-[#f2665e] focus:shadow-[0_0_0_4px_rgba(242,102,94,0.1)]`}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1 font-sans text-right">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>
                    <div style={{
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        direction: 'rtl'
                    }}>
                        <input
                            type="checkbox"
                            id="joinClub"
                            checked={joinClub}
                            onChange={(e) => setJoinClub(e.target.checked)}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: '#667eea'
                            }}
                        />
                        <label htmlFor="joinClub" style={{
                            fontSize: '14px',
                            color: '#333',
                            cursor: 'pointer',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                            אני רוצה להצטרף למועדון הלקוחות ולקבל הטבות 🎁
                        </label>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full p-4 bg-gradient-to-br from-[#f2665e] to-[#e1574f] text-white border-none rounded-xl text-base font-semibold font-sans cursor-pointer shadow-[0_4px_15px_rgba(242,102,94,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,102,94,0.5)]"
                    >
                        צור חשבון
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-8 text-center">
                    <div className="absolute left-0 top-1/2 w-full h-px bg-gray-200"></div>
                    <span className="relative bg-white px-4 text-gray-400 text-[13px] font-sans">
                        או
                    </span>
                </div>

                {/* Social Sign Up */}
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
                        <span>המשך עם Google</span>
                    </button>
                </div>

                {/* Login Link */}
                <div className="text-center text-sm text-gray-500 font-sans">
                    כבר יש לך חשבון?{' '}
                    <a
                        href="/login"
                        style={{ color: '#f2665e' }}
                        className="!text-[#f2665e] font-semibold no-underline transition-colors duration-300 hover:!text-[#e1574f]"
                        onMouseEnter={(e) => e.target.style.color = '#e1574f'}
                        onMouseLeave={(e) => e.target.style.color = '#f2665e'}
                    >
                        התחבר
                    </a>
                </div>
            </div>
        </div>
    );
}