import React, { useState } from 'react';
import { signUp } from '../api/auth';
import { Link, useNavigate } from 'react-router-dom';


export default function SignUpPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const Navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.fullName) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.length < 2) {
            newErrors.fullName = 'Name must be at least 2 characters';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        //api call to submit async 
        signUp(formData.fullName, formData.email, formData.password)
            .then(response => {
                alert('Account created successfully!');
                setFormData({
                    fullName: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                Navigate('/logIn');
            })
            .catch(error => {
                console.error('Error creating account:', error);
                alert('Failed to create account. Please try again.');
            });
    };


    const handleSocialSignUp = (provider) => {
        //add sign up with google

       
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

            <div className="animate-slide-up" style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                padding: '48px 40px',
                width: '100%',
                maxWidth: '440px'
            }}>
                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 className="gradient-text" style={{
                        fontSize: '36px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                        Create Account
                    </h1>
                    <p style={{
                        color: '#666',
                        fontSize: '14px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}>
                        Sign up to get started
                    </p>
                </div>

                {/* Sign Up Form */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="fullName" style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: errors.fullName ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                if (!errors.fullName) {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = errors.fullName ? '#ef4444' : '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {errors.fullName && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '12px',
                                marginTop: '4px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                {errors.fullName}
                            </p>
                        )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="email" style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                if (!errors.email) {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {errors.email && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '12px',
                                marginTop: '4px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="password" style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: errors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                if (!errors.password) {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = errors.password ? '#ef4444' : '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {errors.password && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '12px',
                                marginTop: '4px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label htmlFor="confirmPassword" style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#333',
                            fontWeight: 500,
                            fontSize: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: errors.confirmPassword ? '2px solid #ef4444' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                if (!errors.confirmPassword) {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#e5e7eb';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                        {errors.confirmPassword && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '12px',
                                marginTop: '4px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                        }}
                    >
                        Create Account
                    </button>
                </div>

                {/* Divider */}
                <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        width: '100%',
                        height: '1px',
                        backgroundColor: '#e5e7eb'
                    }}></div>
                    <span style={{
                        backgroundColor: 'white',
                        padding: '0 16px',
                        color: '#999',
                        fontSize: '13px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        position: 'relative'
                    }}>
                        OR
                    </span>
                </div>

                {/* Social Sign Up */}
                <div style={{ marginBottom: '32px' }}>
                    <button
                        onClick={() => handleSocialSignUp('Google')}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#667eea';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                </div>

                {/* Login Link */}
                <div style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontWeight: 600,
                            transition: 'color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#764ba2'}
                        onMouseLeave={(e) => e.target.style.color = '#667eea'}
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}