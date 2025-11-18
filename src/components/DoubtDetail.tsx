// DoubtDetail component
import { useState, useEffect } from 'react';
import { getReplies, addReply, verifyReply } from '../lib/firestore';
import { uploadFile } from '../lib/storage';
import { auth } from '../lib/firebase';
import { getCurrentUserData } from '../lib/auth';
import ReplyCard from './ReplyCard.astro';

interface Reply {
  id: string;
  replyText: string;
  repliedBy: string;
  timestamp: Date;
  isTeacherVerified: boolean;
  fileURL?: string;
}

interface Question {
  id: string;
  question: string;
  subject: string;
  topic: string;
  askedBy: string;
  createdAt: Date;
  status: 'open' | 'answered';
  attachments?: string[];
}

interface Props {
  question: Question;
  initialReplies: Reply[];
}

export default function DoubtDetail({ question, initialReplies }: Props) {
  const [replies, setReplies] = useState<Reply[]>(initialReplies);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check user role
    const fetchUserRole = async () => {
      const userData = await getCurrentUserData();
      if (userData) {
        setUserRole(userData.role || 'student');
      }
    };
    fetchUserRole();
  }, []);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage({ type: 'error', text: 'Please login to reply' });
        setLoading(false);
        return;
      }

      let fileURL = '';
      if (replyFile) {
        const uploadResult = await uploadFile(replyFile, `replies/${Date.now()}_${replyFile.name}`);
        if (uploadResult.success) {
          fileURL = uploadResult.url;
        }
      }

      const result = await addReply(question.id, {
        replyText,
        repliedBy: user.uid,
        fileURL: fileURL || undefined
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Reply posted successfully!' });
        setReplyText('');
        setReplyFile(null);
        
        // Reload replies
        const newReplies = await getReplies(question.id);
        setReplies(newReplies);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to post reply' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReply = async (replyId: string) => {
    try {
      const result = await verifyReply(question.id, replyId);
      if (result.success) {
        // Reload replies
        const newReplies = await getReplies(question.id);
        setReplies(newReplies);
      }
    } catch (error) {
      console.error('Error verifying reply:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div>
      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-[#A00021] text-white text-sm font-semibold rounded-lg">
                {question.subject}
              </span>
              <span className="px-3 py-1 bg-[#F7C548] text-[#A00021] text-sm font-semibold rounded-lg">
                {question.topic}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                question.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {question.status === 'open' ? 'Open' : 'Answered'}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              Asked by: {question.askedBy === 'anonymous' ? 'Anonymous' : question.askedBy}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              {formatDate(question.createdAt)}
            </p>
          </div>
        </div>
        
        <p className="text-gray-800 mb-4 leading-relaxed text-lg">{question.question}</p>
        
        {question.attachments && question.attachments.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Attachments:</p>
            <div className="flex flex-wrap gap-2">
              {question.attachments.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#A00021] hover:text-[#F7C548] text-sm underline"
                >
                  View File {idx + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Replies ({replies.length})</h2>
        
        {replies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-gray-600">No replies yet. Be the first to answer!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#F7C548]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800">{reply.repliedBy}</span>
                      {reply.isTeacherVerified && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-lg flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                          </svg>
                          Teacher Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs">{formatDate(reply.timestamp)}</p>
                  </div>
                  {userRole === 'teacher' && !reply.isTeacherVerified && (
                    <button
                      onClick={() => handleVerifyReply(reply.id)}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Verify
                    </button>
                  )}
                </div>
                
                <p className="text-gray-800 mb-3 leading-relaxed">{reply.replyText}</p>
                
                {reply.fileURL && (
                  <div className="mt-3">
                    <a
                      href={reply.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A00021] hover:text-[#F7C548] text-sm font-semibold underline"
                    >
                      View Attachment
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Post a Reply</h2>
        
        {message && (
          <div className={`mb-4 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Reply *
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
              placeholder="Write your reply here..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
              accept="image/*,application/pdf,audio/*,video/*"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A00021] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Reply'}
          </button>
        </form>
      </div>
    </div>
  );
}

