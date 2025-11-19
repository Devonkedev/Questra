import { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, sendVerificationEmail, isEmailVerified } from '../lib/auth';
import { getAuthInstance } from '../lib/firebase';

const getFriendlyErrorMessage = (error?: string, isAuthError = false) => {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  // Never show the "access" message - it's misleading
  // Permission errors are usually Firestore issues, not auth issues
  if (error.includes('Missing or insufficient permissions')) {
    // This is a Firestore security rules issue
    // Don't show it as an auth error - it happens after successful login
    return 'Unable to access data. Please verify your email address or contact support if the issue persists.';
  }
  
  // For actual auth errors, show the Firebase error message
  return error;
};

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'student' | 'teacher'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check email verification status
  useEffect(() => {
    const checkVerification = async () => {
      const auth = await getAuthInstance();
      if (auth?.currentUser) {
        const verified = await isEmailVerified();
        if (!verified) {
          setShowVerificationNotice(true);
          setUserEmail(auth.currentUser.email);
        }
      }
    };
    checkVerification();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
        
        if (result.success) {
          // Check if email is verified
          if (!result.emailVerified) {
            setShowVerificationNotice(true);
            setUserEmail(result.user?.email || null);
            setMessage({ 
              type: 'warning', 
              text: 'Your email is not verified. Please check your inbox for the verification link and verify your email before using all features.' 
            });
            // Still allow login, but show warning
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          } else {
            setMessage({ type: 'success', text: 'Login successful!' });
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } else {
          // This is a login error, so pass isAuthError=true
          setMessage({ type: 'error', text: getFriendlyErrorMessage(result.error, true) });
        }
      } else {
        if (!formData.name) {
          throw new Error('Name is required');
        }
        result = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.role
        );

        if (result.success) {
          if (result.emailVerificationSent) {
            setMessage({ 
              type: 'success', 
              text: 'Account created successfully! A verification email has been sent to ' + formData.email + '. Please check your inbox (and spam folder) and click the verification link before logging in.' 
            });
            // Switch to login tab after a moment
            setTimeout(() => {
              setIsLogin(true);
              setFormData({ ...formData, password: '', email: formData.email });
            }, 3000);
          } else if (result.warning) {
            // Account created but email verification failed
            setMessage({ 
              type: 'warning', 
              text: result.warning 
            });
            // Switch to login tab so they can resend
            setTimeout(() => {
              setIsLogin(true);
              setFormData({ ...formData, password: '', email: formData.email });
            }, 5000);
          } else {
            // Account created but no verification email sent (shouldn't happen, but handle it)
            setMessage({ 
              type: 'warning', 
              text: 'Account created successfully! However, verification email was not sent. Please log in and use "Resend Verification Email" button.' 
            });
            setTimeout(() => {
              setIsLogin(true);
              setFormData({ ...formData, password: '', email: formData.email });
            }, 4000);
          }
        } else {
          // This is a signup error, so pass isAuthError=true
          setMessage({ type: 'error', text: getFriendlyErrorMessage(result.error, true) });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: getFriendlyErrorMessage(error?.message, true) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!formData.email) {
        setMessage({ type: 'error', text: 'Please enter your email address' });
        setLoading(false);
        return;
      }

      const result = await resetPassword(formData.email);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Password reset email sent! Check your inbox.' });
        setShowForgotPassword(false);
      } else {
        setMessage({ type: 'error', text: getFriendlyErrorMessage(result.error || 'Failed to send reset email', false) });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: getFriendlyErrorMessage(error?.message, false) });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await sendVerificationEmail();
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Verification email sent! Check your inbox.' });
      } else {
        setMessage({ type: 'error', text: getFriendlyErrorMessage(result.error || 'Failed to send verification email', false) });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: getFriendlyErrorMessage(error?.message, false) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-2 rounded-xl font-semibold transition-colors ${
            isLogin
              ? 'bg-[#A00021] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-2 rounded-xl font-semibold transition-colors ${
            !isLogin
              ? 'bg-[#A00021] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Sign Up
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : message.type === 'warning'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showVerificationNotice && userEmail && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-orange-800 mb-1">Email Verification Required</h3>
              <p className="text-sm text-orange-700 mb-3">
                Please verify your email address <strong>({userEmail})</strong> to access all features. Check your inbox (and spam folder) for the verification email from Firebase.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reset Password</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#A00021] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setMessage(null);
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required={!isLogin}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
              placeholder="Enter your name"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Password *
            </label>
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-[#A00021] hover:text-[#F7C548] font-semibold"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        {!isLogin && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'teacher' })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A00021] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
      )}
    </div>
  );
}


