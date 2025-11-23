import React, { useState } from 'react';
import { resetPassword } from '../api/auth';
import { useNavigate } from 'react-router-dom';
export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const Navigate = useNavigate()

  const getParamsFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      token: params.get('token'),
      userId: params.get('id') 
    };
  };
  const handleResetPassword = () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Both fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const { token, userId } = getParamsFromUrl(); // 2. UPDATE: Get both

    if (!token || !userId) {
      setError('Invalid or missing reset token/ID');
      return;
    }

    resetPassword(userId, token, newPassword)
      .then(() => {
        setResetSuccess(true);
        setTimeout(() => {
          Navigate('/login');
        }, 3000);
      })
      .catch((err) => {
        setError(err.response?.data?.msg || 'Failed to reset password.');
      });

  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#ef4444' };
    if (strength <= 3) return { strength: 66, label: 'Medium', color: '#f59e0b' };
    return { strength: 100, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            opacity: 0.9
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="gradient-text" style={{
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Reset Password
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.6'
          }}>
            Enter your new password below
          </p>
        </div>

        {/* Success Message */}
        {resetSuccess && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#d1fae5',
            border: '2px solid #10b981',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p style={{
              color: '#065f46',
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: 0
            }}>
              Password reset successfully! Redirecting to login...
            </p>
          </div>
        )}

        {/* New Password Input */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="newPassword" style={{
            display: 'block',
            marginBottom: '8px',
            color: '#333',
            fontWeight: 500,
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your new password"
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#666'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div style={{ marginTop: '8px' }}>
              <div style={{
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${passwordStrength.strength}%`,
                  backgroundColor: passwordStrength.color,
                  transition: 'all 0.3s ease'
                }} />
              </div>
              <p style={{
                fontSize: '12px',
                color: passwordStrength.color,
                marginTop: '4px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
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
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirm your new password"
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!error) {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? '#ef4444' : '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: '#666'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showConfirmPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '12px',
              marginTop: '4px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Reset Password Button */}
        <button
          onClick={handleResetPassword}
          disabled={resetSuccess}
          style={{
            width: '100%',
            padding: '16px',
            background: resetSuccess ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: resetSuccess ? 'not-allowed' : 'pointer',
            boxShadow: resetSuccess ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            if (!resetSuccess) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!resetSuccess) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }
          }}
        >
          {resetSuccess ? 'Password Reset!' : 'Reset Password'}
        </button>

        {/* Password Requirements */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px'
        }}>
          <p style={{
            color: '#333',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            marginBottom: '8px'
          }}>
            Password Requirements:
          </p>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: '#666',
            fontSize: '12px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.8'
          }}>
            <li>At least 8 characters long</li>
            <li>Mix of uppercase and lowercase letters</li>
            <li>Include at least one number</li>
            <li>Special characters recommended</li>
          </ul>
        </div>
      </div>
    </div>
  );
}