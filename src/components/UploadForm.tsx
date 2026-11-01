import { useState, useEffect } from 'react';
import { uploadFile } from '../lib/storage';
import { createNote } from '../lib/firestore';
import { getAuthInstance } from '../lib/firebase';
import { getCurrentUserData } from '../lib/auth';
import SubjectDropdown from './SubjectDropdown';

export default function UploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    file: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUserData();
      if (userData) {
        setUserName(userData.name || userData.email || 'Unknown');
        setIsTeacher(userData.role === 'teacher');
      }
      setCheckingRole(false);
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!formData.file) {
        throw new Error('Please select a file');
      }

      // Upload file to Firebase Storage
      const filePath = `notes/${Date.now()}_${formData.file.name}`;
      const uploadResult = await uploadFile(formData.file, filePath);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Save note metadata to Firestore
      const auth = await getAuthInstance();
      const user = auth?.currentUser;
      const noteResult = await createNote({
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        fileURL: uploadResult.url,
        uploadedBy: userName || user?.email || 'Unknown'
      });

      if (!noteResult.success) {
        throw new Error(noteResult.error || 'Failed to save note');
      }

      setMessage({ type: 'success', text: 'Note uploaded successfully!' });
      setFormData({
        title: '',
        subject: '',
        description: '',
        file: null
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Only teachers can upload notes and resources.</p>
        <a href="/notes" className="inline-block mt-4 text-[#312E81] font-semibold hover:underline">
          ← Back to Notes
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Resource</h2>
      
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
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
            placeholder="Enter resource title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject *
          </label>
          <SubjectDropdown
            value={formData.subject}
            onChange={(value) => setFormData({ ...formData, subject: value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
            placeholder="Enter resource description"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            File *
          </label>
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#312E81] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#312E81]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Resource'}
        </button>
      </div>
    </form>
  );
}

