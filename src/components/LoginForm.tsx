// LoginForm component
import { useState } from 'react';
import { signIn, signUp } from '../lib/auth';

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'student' | 'teacher'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
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
      }

      if (result.success) {
        setMessage({ type: 'success', text: isLogin ? 'Login successful!' : 'Account created successfully!' });
        // Redirect to home or dashboard
        window.location.href = '/';
      } else {
        setMessage({ type: 'error', text: result.error || 'An error occurred' });
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
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

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
          <label class="block text-sm font-semibold text-gray-700 mb-2">
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
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Password *
          </label>
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
    </div>
  );
}

