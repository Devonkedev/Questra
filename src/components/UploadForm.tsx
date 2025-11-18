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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUserData();
      if (userData) {
        setUserName(userData.name || userData.email || 'Unknown');
      }
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
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#A00021] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Resource'}
        </button>
      </div>
    </form>
  );
}

