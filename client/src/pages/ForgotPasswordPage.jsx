import { useState } from 'react';
import {forgotPasswordRequest} from '../api/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = () => {
    setError('');
    setEmailPreviewUrl('');
    
    if (!resetEmail) {
      setError('יש להזין כתובת מייל');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      setError('נא להזין כתובת מייל תקינה');
      return;
    }

    setLoading(true);
    forgotPasswordRequest(resetEmail)
      .then((response) => {
        setResetSuccess(true);
        const preview = response.data?.previewUrl || '';
        if (preview) setEmailPreviewUrl(preview);
        setTimeout(() => {
          setResetSuccess(false);
          setEmailPreviewUrl('');
          setResetEmail('');
        }, preview ? 60000 : 8000);
      })
      .catch((err) => {
        const code = err.response?.data?.code;
        const serverMsg = err.response?.data?.msg;
        if (code === 'EMAIL_NOT_CONFIGURED') {
          setError('שירות המייל לא מוגדר בשרת. פנו למנהל המערכת.');
          return;
        }
        setError(serverMsg || 'שליחת המייל נכשלה. נסו שוב.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f2665e 0%, #d95248 100%)'
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
        @keyframes forgot-password-spin {
          to { transform: rotate(360deg); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .gradient-text {
          /* UPDATED: Theme color gradient for text */
          background: linear-gradient(135deg, #f2665e 0%, #d95248 100%);
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
            background: 'linear-gradient(135deg, #f2665e 0%, #d95248 100%)',
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
            שכחת סיסמה?
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.6'
          }}>
            אל דאגה, נשלח אליך הוראות לאיפוס הסיסמה למייל
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
            <div style={{ color: '#065f46', fontSize: '14px', margin: 0 }}>
              <p style={{ margin: '0 0 8px 0' }}>קישור לאיפוס סיסמה נשלח! בדקו את תיבת המייל שלכם.</p>
              {emailPreviewUrl && (
                <p style={{ margin: 0 }}>
                  <a href={emailPreviewUrl} target="_blank" rel="noreferrer" style={{ color: '#047857', fontWeight: 600 }}>
                    לחצו כאן לצפייה במייל (פיתוח)
                  </a>
                </p>
              )}
            </div>
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
            כתובת מייל
          </label>
          <input
            type="email"
            id="resetEmail"
            value={resetEmail}
            disabled={loading || resetSuccess}
            onChange={(e) => {
              setResetEmail(e.target.value);
              setError('');
            }}
            placeholder="name@example.com"
            dir="ltr"
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
                e.target.style.borderColor = '#f2665e';
                e.target.style.boxShadow = '0 0 0 4px rgba(242, 102, 94, 0.1)';
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
          disabled={resetSuccess || loading}
          style={{
            width: '100%',
            padding: '16px',
            background: resetSuccess || loading
              ? '#d1d5db'
              : 'linear-gradient(135deg, #f2665e 0%, #d95248 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            cursor: resetSuccess || loading ? 'not-allowed' : 'pointer',
            boxShadow: resetSuccess || loading ? 'none' : '0 4px 15px rgba(242, 102, 94, 0.4)',
            transition: 'all 0.3s ease',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: loading ? 0.85 : 1
          }}
          onMouseEnter={(e) => {
            if (!resetSuccess && !loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(242, 102, 94, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!resetSuccess && !loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(242, 102, 94, 0.4)';
            }
          }}
        >
          {loading && (
            <span
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.35)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'forgot-password-spin 0.7s linear infinite',
                flexShrink: 0
              }}
            />
          )}
          {loading ? 'שולח קישור...' : resetSuccess ? 'המייל נשלח!' : 'שלח קישור לאיפוס'}
        </button>

        {/* Back to Login Button */}
        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '16px',
            background: 'transparent',
            color: '#f2665e',
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          חזרה להתחברות
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
            זוכרים את הסיסמה?{' '}
            <Link
              to="/login"
              style={{
                color: '#f2665e',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#d95248'}
              onMouseLeave={(e) => e.target.style.color = '#f2665e'}
            >
              התחברו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}