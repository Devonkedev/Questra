import { useState, useEffect } from 'react';
import { getQuestions, verifyReply } from '../lib/firestore';
import SubjectDropdown from './SubjectDropdown';

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
  initialQuestions: Question[];
}

export default function TeacherDashboard({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [filter, setFilter] = useState({ subject: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const filteredQuestions = await getQuestions(filter);
        setQuestions(filteredQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [filter]);

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
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Questions</h3>
          <p className="text-3xl font-bold text-[#A00021]">{questions.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Open Questions</h3>
          <p className="text-3xl font-bold text-green-600">
            {questions.filter(q => q.status === 'open').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Answered</h3>
          <p className="text-3xl font-bold text-blue-600">
            {questions.filter(q => q.status === 'answered').length}
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Questions</h2>
        <div className="max-w-xs">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subject
          </label>
          <SubjectDropdown
            value={filter.subject}
            onChange={(value) => setFilter({ subject: value })}
          />
        </div>
      </div>

      {/* Questions List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Questions</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <p className="text-gray-600">No questions found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-[#A00021] text-white text-sm font-semibold rounded-lg">
                        {q.subject}
                      </span>
                      <span className="px-3 py-1 bg-[#F7C548] text-[#A00021] text-sm font-semibold rounded-lg">
                        {q.topic}
                      </span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                        q.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {q.status === 'open' ? 'Open' : 'Answered'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      Asked by: {q.askedBy === 'anonymous' ? 'Anonymous' : q.askedBy}
                    </p>
                    <p className="text-gray-500 text-xs mb-4">
                      {formatDate(q.createdAt)}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-800 mb-4 leading-relaxed">{q.question}</p>
                
                {q.attachments && q.attachments.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {q.attachments.map((url, idx) => (
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
                
                <a
                  href={`/doubts/${q.id}`}
                  className="inline-block bg-[#A00021] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors"
                >
                  View & Reply
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/upload"
            className="bg-[#F7C548] text-[#A00021] px-6 py-3 rounded-xl font-semibold hover:bg-[#F7C548]/90 transition-colors"
          >
            Upload Resource
          </a>
          <a
            href="/doubts"
            className="bg-[#A00021] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#A00021]/90 transition-colors"
          >
            Browse All Doubts
          </a>
        </div>
      </div>
    </div>
  );
}

