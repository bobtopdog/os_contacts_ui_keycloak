'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

const NOTES_API = process.env.NEXT_PUBLIC_NOTES_API_URL ?? 'http://localhost:3000';

async function fetchUsernameSuggestions(q: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(
    `${NOTES_API}/api/usernames?q=${encodeURIComponent(q)}`,
    { cache: 'no-store', signal }
  );
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Debounced username input with suggestions sourced from /api/usernames.
 * Drop-in replacement for the plain member-username inputs in the
 * MeetingGroupsPanel and CommunitiesPanel.
 *
 * - 300ms debounce, minimum 2 characters before searching
 * - In-flight requests aborted automatically when the term changes
 * - Keyboard support: ↑/↓ to navigate, Enter to pick, Esc to close
 */
export default function UsernameAutocomplete({
  value, onChange, placeholder = 'Username…', disabled = false, size = 'sm',
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounce(value, 300);

  const { data: suggestions } = useQuery<string[]>({
    queryKey: ['username-suggestions', debouncedValue],
    queryFn: ({ signal }) => fetchUsernameSuggestions(debouncedValue, signal),
    enabled: debouncedValue.trim().length >= 2,
    staleTime: 60_000,
  });

  // Close the dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const items = (suggestions ?? []).filter((s) => s !== value);
  const showDropdown = open && items.length > 0 && value.trim().length >= 2;

  function pick(username: string) {
    onChange(username);
    setOpen(false);
    setHighlight(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(items[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="position-relative flex-grow-1" ref={wrapperRef}>
      <input
        type="text"
        className={`form-control ${size === 'sm' ? 'form-control-sm' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          className="list-group position-absolute w-100 shadow-sm"
          style={{ zIndex: 1056, top: '100%', maxHeight: '200px', overflowY: 'auto' }}
        >
          {items.map((username, i) => (
            <li
              key={username}
              className={`list-group-item list-group-item-action py-1 px-2 small ${
                i === highlight ? 'active' : ''
              }`}
              style={{ cursor: 'pointer' }}
              onMouseDown={(e) => { e.preventDefault(); pick(username); }}
              onMouseEnter={() => setHighlight(i)}
            >
              👤 {username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
