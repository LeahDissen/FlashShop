import React, { useState } from 'react';
import {forgotPasswordRequest} from '../api/auth';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = () => {
    setError('');
    
    if (!resetEmail) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    forgotPasswordRequest(resetEmail)
      .then(() => {
        setResetSuccess(true);
      })
      .catch((err) => {
        setError('Failed to send reset email. Please try again.');
      });
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setResetSuccess(false);
      setResetEmail('');
    }, 5000);
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
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          
          <h1 className="gradient-text" style={{
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Forgot Password?
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.6'
          }}>
            No worries, we'll send you reset instructions to your email
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
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p style={{
              color: '#065f46',
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              margin: 0
            }}>
              Password reset link sent! Check your email.
            </p>
          </div>
        )}

        {/* Email Input */}
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="resetEmail" style={{
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
            id="resetEmail"
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.target.value);
              setError('');
            }}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '14px 16px',
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

        {/* Send Reset Link Button */}
        <button
          onClick={handleForgotPassword}
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
          {resetSuccess ? 'Email Sent!' : 'Send Reset Link'}
        </button>

        {/* Back to Login Button */}
        <button
          onClick={() => window.history.back()}
          style={{
            width: '100%',
            padding: '16px',
            background: 'transparent',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Login
        </button>

        {/* Help Text */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#666',
            fontSize: '13px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Remember your password?{' '}
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
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}