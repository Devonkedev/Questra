// NotesList component with filtering and sorting
import { useState, useEffect, useMemo } from 'react';
import { getNotes } from '../lib/firestore';
import SubjectDropdown from './SubjectDropdown';

interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  fileURL: string;
  createdAt: Date;
  uploadedBy: string;
}

interface Props {
  initialNotes: Note[];
}

export default function NotesList({ initialNotes = [] }: Props) {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState({ subject: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);

  // Load all notes on mount
  useEffect(() => {
    const loadAllNotes = async () => {
      setLoading(true);
      try {
        const fetchedNotes = await getNotes({}, 50);
        setAllNotes(fetchedNotes || []);
      } catch (error) {
        console.error('Error loading notes:', error);
        setAllNotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllNotes();
  }, []);

  // Filter and sort notes based on current settings
  const notes = useMemo(() => {
    let filtered = allNotes;
    
    // Apply subject filter
    if (filter.subject) {
      filtered = filtered.filter(note => note.subject === filter.subject);
    }
    
    // Sort notes
    if (filtered.length === 0) return [];
    
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [allNotes, filter.subject, sortBy]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters & Sort</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <SubjectDropdown
              value={filter.subject}
              onChange={(value) => setFilter({ subject: value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A00021] focus:border-transparent bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md">
          <p className="text-gray-600">No notes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[#A00021] text-white text-sm font-semibold rounded-lg">
                      {note.subject}
                    </span>
                    <span className="text-gray-500 text-xs">{formatDate(note.createdAt)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{note.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">By: {note.uploadedBy}</p>
                  <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">{note.description}</p>
                </div>
              </div>
              
              <a
                href={note.fileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center bg-[#FFD700] text-[#A00021] px-6 py-2 rounded-xl font-semibold hover:bg-[#FFD700]/90 transition-colors"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

