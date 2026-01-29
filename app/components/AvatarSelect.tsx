'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const AVATARS = Array.from({ length: 17 }, (_, i) => ({
  id: `trainer-${String(i + 1).padStart(2, '0')}`,
  url: `/avatars/trainer-${String(i + 1).padStart(2, '0')}.webp`,
  name: `Trainer ${i + 1}`,
}));

interface AvatarSelectProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function AvatarSelect({ value, onChange, className = '' }: AvatarSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = AVATARS.find((a) => a.url === value) || AVATARS[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Image
          src={selected.url}
          alt={selected.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
        <span className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200">
          {selected.name}
        </span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 p-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => {
                  onChange(avatar.url);
                  setIsOpen(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  value === avatar.url
                    ? 'bg-slate-900 dark:bg-indigo-600'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Image
                  src={avatar.url}
                  alt={avatar.name}
                  width={48}
                  height={48}
                  className="rounded-full object-cover mx-auto"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AVATARS };
