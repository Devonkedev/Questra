import { useEffect, useState } from 'react';
import { getCurrentUserData } from '../lib/auth';

export default function AppContent() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getCurrentUserData();
        setUserData(data);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#A00021] mb-2">Welcome to Questra</h1>
        <p className="text-gray-600 text-lg">Your learning hub for asking doubts and accessing resources</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Ask a Doubt Card */}
        <a href="/ask" className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-center transition-all transform hover:-translate-y-1 border border-gray-100 group">
          <div className="w-16 h-16 bg-gradient-to-br from-[#DC143C] to-[#C41E3A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Ask a Doubt</h3>
          <p className="text-gray-600">
            Post your questions and get help from teachers
          </p>
        </a>

        {/* Browse Doubts Card */}
        <a href="/doubts" className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-center transition-all transform hover:-translate-y-1 border border-gray-100 group">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFA500] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Browse Doubts</h3>
          <p className="text-gray-600">
            View and answer questions from other students
          </p>
        </a>

        {/* Notes Card */}
        <a href="/notes" className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-center transition-all transform hover:-translate-y-1 border border-gray-100 group">
          <div className="w-16 h-16 bg-gradient-to-br from-[#DC143C] to-[#C41E3A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Study Resources</h3>
          <p className="text-gray-600">
            Access notes and materials uploaded by teachers
          </p>
        </a>

        {/* Upload Card (for teachers) */}
        {userData?.role === 'teacher' && (
          <a href="/upload" className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-center transition-all transform hover:-translate-y-1 border border-gray-100 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFA500] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Upload Resource</h3>
            <p className="text-gray-600">
              Share notes and study materials with students
            </p>
          </a>
        )}

        {/* Teacher Dashboard Card (for teachers) */}
        {userData?.role === 'teacher' && (
          <a href="/dashboard" className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-8 text-center transition-all transform hover:-translate-y-1 border border-gray-100 group">
            <div className="w-16 h-16 bg-gradient-to-br from-[#DC143C] to-[#C41E3A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Teacher Dashboard</h3>
            <p className="text-gray-600">
              Manage doubts, verify answers, and track activity
            </p>
          </a>
        )}
      </div>

      {userData && (
        <div className="bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] rounded-2xl p-6 text-center">
          <p className="text-white text-lg font-semibold">
            Welcome back, {userData.name || userData.email}!
          </p>
          {userData.role && (
            <p className="text-white/90 mt-1">
              Role: {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

