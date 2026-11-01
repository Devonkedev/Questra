import { useState, useEffect } from 'react';
import { getCurrentUserData } from '../lib/auth';

export default function UploadButton() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const userData = await getCurrentUserData();
      console.log('UploadButton - userData:', userData);
      console.log('UploadButton - role:', userData?.role);
      setIsTeacher(userData?.role === 'teacher');
      setLoading(false);
    };
    checkRole();
  }, []);

  if (loading) return null;
  if (!isTeacher) {
    console.log('UploadButton - Not showing: user is not a teacher');
    return null;
  }

  return (
    <a 
      href="/upload" 
      className="inline-block mt-4 bg-gradient-to-r from-[#5EEAD4] to-[#2DD4BF] text-[#1E1B4B] px-6 py-3 rounded-xl font-bold hover:from-[#2DD4BF] hover:to-[#14B8A6] transition-all shadow-lg"
    >
      + Upload Notes
    </a>
  );
}

