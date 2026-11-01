import { useState } from 'react';
import { createQuestion } from '../lib/firestore';
import { uploadFiles } from '../lib/storage';
import SubjectDropdown from './SubjectDropdown';
import { getAuthInstance } from '../lib/firebase';
import { getCurrentUserData } from '../lib/auth';

const topics = {
  Physics: ['Measurements & Uncertainties', 'Mechanics', 'Circular Motion & Gravitation', 'Thermal Physics', 'Waves', 'Electricity & Magnetism', 'Atomic, Nuclear & Particle Physics', 'Energy Production'],
  Math: ['Numbers & Algebra', 'Functions', 'Calculus', 'Geometry & Trigonometry', 'Statistics & Probability'],
  Chemistry: ['Measurement & Data Processing', 'Stoichiometry', 'Atomic Structure', 'Chemical Bonding & Structure', 'Enthalpies', "Rate of Reaction", "Equilibrium", "Acids & Bases", "Redox Reactions", "Organic Chemistry"]
};

export default function AskDoubtForm() {
  const [formData, setFormData] = useState({
    question: '',
    subject: '',
    topic: '',
    isAnonymous: false,
    files: [] as File[]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, files: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let attachmentUrls: string[] = [];

      // Upload files if any
      if (formData.files.length > 0) {
        const uploadResults = await uploadFiles(formData.files, 'questions');
        attachmentUrls = uploadResults
          .filter(result => result.success)
          .map(result => result.url);
      }

      // Get current user
      const authInstance = await getAuthInstance();
      const user = authInstance?.currentUser;
      
      if (!user) {
        throw new Error('You must be logged in to post a question. Please refresh the page and try again.');
      }

      // Get user data for better tracking
      let userData = null;
      try {
        userData = await getCurrentUserData();
      } catch (err) {
        console.warn('Could not fetch user data:', err);
      }

      const askedBy = formData.isAnonymous 
        ? 'anonymous' 
        : (userData?.name || userData?.email || user.email || user.uid);

      // Create question with user ID for security rules
      const result = await createQuestion({
        question: formData.question,
        subject: formData.subject,
        topic: formData.topic,
        askedBy,
        askedById: user.uid, // Add user ID for Firestore security rules
        attachments: attachmentUrls
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Question posted successfully!' });
        setFormData({
          question: '',
          subject: '',
          topic: '',
          isAnonymous: false,
          files: []
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to post question' });
      }
    } catch (error: any) {
      console.error('Error posting question:', error);
      let errorMessage = error.message || 'An error occurred while posting your question.';
      
      // Provide more helpful error messages
      if (error.message?.includes('Missing or insufficient permissions')) {
        errorMessage = 'Permission denied. Please make sure you are logged in and your account is verified. If the problem persists, contact support.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'You do not have permission to post questions. Please contact support if you believe this is an error.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const availableTopics = formData.subject ? topics[formData.subject as keyof typeof topics] || [] : [];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8">
      {message && (
        <div className={`mb-4 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject *
          </label>
          <SubjectDropdown
            value={formData.subject}
            onChange={(value) => setFormData({ ...formData, subject: value, topic: '' })}
            required
          />
        </div>

        {formData.subject && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic *
            </label>
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent bg-white"
            >
              <option value="">Select Topic</option>
              {availableTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your Question *
          </label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
            placeholder="Describe your doubt in detail..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,application/pdf,audio/*,video/*"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can upload images, PDFs, audio, or video files
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="w-4 h-4 text-[#312E81] border-gray-300 rounded focus:ring-[#312E81]"
          />
          <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
            Ask anonymously
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#312E81] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#312E81]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Posting...' : 'Post Question'}
        </button>
      </div>
    </form>
  );
}

