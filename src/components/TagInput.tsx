import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CloseIcon, PlusIcon } from '../lib/icons';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  tone?: 'pink' | 'amber' | 'mint';
}

export function TagInput({ value, onChange, placeholder = '输入后回车添加', tone = 'mint' }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const text = draft.trim().replace(/[,，、]/g, '');
    if (!text) return;
    if (value.includes(text)) {
      setDraft('');
      return;
    }
    onChange([...value, text]);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-list">
        {value.map((tag) => (
          <span key={tag} className={`tag tag-${tone}`}>
            {tag}
            <button
              type="button"
              aria-label={`删除 ${tag}`}
              onClick={() => onChange(value.filter((v) => v !== tag))}
            >
              <CloseIcon size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : '继续添加'}
        />
      </div>
      <button type="button" className="tag-add" onClick={commit} aria-label="添加标签">
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
