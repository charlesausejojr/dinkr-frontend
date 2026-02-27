import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = 'Type and press Enter...' }: TagInputProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 border-2 border-gray-200 rounded-sm focus-within:border-court-green bg-white min-h-[44px]">
      {value.map(tag => (
        <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-court-green text-white text-xs font-display rounded-sm">
          {tag}
          <button type="button" onClick={() => onChange(value.filter(t => t !== tag))}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none text-sm font-body bg-transparent"
      />
    </div>
  );
}
