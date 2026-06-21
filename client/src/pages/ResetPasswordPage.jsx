import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token || !userId) {
      setError('קישור האיפוס לא תקין. בקשו קישור חדש.');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(userId, token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'איפוס הסיסמה נכשל. ייתכן שפג תוקף הקישור.');
    } finally {
      setLoading(false);
    }
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
        @keyframes reset-password-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#f2665e'
          }}>
            איפוס סיסמה
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            הזינו סיסמה חדשה לחשבון 
          </p>
        </div>

        {success ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#d1fae5',
            borderRadius: '12px',
            color: '#065f46'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>הסיסמה עודכנה בהצלחה!</h3>
            <p style={{ margin: 0 }}>מעבירים אותכם להתחברות...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500, fontSize: '14px' }}>
                סיסמה חדשה
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="הזינו סיסמה חדשה"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 500, fontSize: '14px' }}>
                אימות סיסמה
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="הזינו שוב את הסיסמה"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #f2665e 0%, #d95248 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: loading ? 0.85 : 1
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
                    animation: 'reset-password-spin 0.7s linear infinite',
                    flexShrink: 0
                  }}
                />
              )}
              {loading ? 'מעדכנים סיסמה...' : 'עדכון סיסמה'}
            </button>

            <p style={{ textAlign: 'center', margin: 0 }}>
              <Link to="/login" style={{ color: '#f2665e', textDecoration: 'none', fontWeight: 600 }}>
                חזרה להתחברות
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}