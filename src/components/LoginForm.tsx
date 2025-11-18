import { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, sendVerificationEmail, isEmailVerified } from '../lib/auth';
import { getAuthInstance } from '../lib/firebase';

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
              text: 'Your email is not verified. Please check your inbox for the verification link.' 
            });
            // Still allow login, but show warning
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            setMessage({ type: 'success', text: 'Login successful!' });
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } else {
          setMessage({ type: 'error', text: result.error || 'An error occurred' });
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
              text: 'Account created! Please check your email to verify your account before logging in.' 
            });
            // Switch to login tab after a moment
            setTimeout(() => {
              setIsLogin(true);
              setFormData({ ...formData, password: '' });
            }, 2000);
          } else {
            setMessage({ type: 'success', text: 'Account created successfully!' });
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } else {
          setMessage({ type: 'error', text: result.error || 'An error occurred' });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
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
        setMessage({ type: 'error', text: result.error || 'Failed to send reset email' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
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
        setMessage({ type: 'error', text: result.error || 'Failed to send verification email' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
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
        <div className="mb-4 p-4 rounded-xl bg-blue-100 text-blue-800">
          <p className="font-semibold mb-2">Email Verification Required</p>
          <p className="text-sm mb-3">
            Please verify your email ({userEmail}) to continue. Check your inbox for the verification link.
          </p>
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 underline font-semibold"
          >
            Resend verification email
          </button>
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

