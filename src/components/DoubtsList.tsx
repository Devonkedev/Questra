// DoubtsList component with filtering
import { useState, useEffect } from 'react';
import { getQuestions } from '../lib/firestore';
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

export default function DoubtsList({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [filters, setFilters] = useState({
    subject: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const filteredQuestions = await getQuestions(filters);
        setQuestions(filteredQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [filters]);

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <SubjectDropdown
              value={filters.subject}
              onChange={(value) => setFilters({ ...filters, subject: value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent bg-white"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="answered">Answered</option>
            </select>
          </div>
        </div>
      </div>

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
                  <p className="text-gray-500 text-xs">
                    {new Date(q.createdAt).toLocaleString()}
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
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

