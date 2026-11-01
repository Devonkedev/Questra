import { useState } from 'react';

interface SubjectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function SubjectDropdown({ value, onChange, required = false }: SubjectDropdownProps) {
  const subjects = ['Physics', 'Math', 'Chemistry'];
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#312E81] focus:border-transparent bg-white"
    >
      <option value="">Select Subject</option>
      {subjects.map((subject) => (
        <option key={subject} value={subject}>
          {subject}
        </option>
      ))}
    </select>
  );
}

