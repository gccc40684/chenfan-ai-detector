import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { countWords } from '../utils/wordCount';

export interface TextInputRef {
  setText: (text: string) => void;
  getText: () => string;
  clear: () => void;
}

interface TextInputProps {
  maxWords?: number;
  onTextChange?: (text: string) => void;
  onSubmit?: (text: string) => void;
  disabled?: boolean;
}

export const TextInput = forwardRef<TextInputRef, TextInputProps>(function TextInput(
  { maxWords = 5000, onTextChange, onSubmit, disabled = false },
  ref
) {
  const [text, setTextState] = useState('');

  const setText = useCallback(
    (newText: string) => {
      setTextState(newText);
      onTextChange?.(newText);
    },
    [onTextChange]
  );

  useImperativeHandle(
    ref,
    () => ({
      setText,
      getText: () => text,
      clear: () => setText(''),
    }),
    [setText, text]
  );

  const wordCount = countWords(text);
  const isOverLimit = wordCount > maxWords;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setTextState(newText);
      onTextChange?.(newText);
    },
    [onTextChange]
  );

  const handleSubmit = useCallback(() => {
    if (text.trim() && !isOverLimit && !disabled) {
      onSubmit?.(text);
    }
  }, [text, isOverLimit, disabled, onSubmit]);

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder="在此输入或粘贴您要检测的文本..."
          className="w-full min-h-[200px] p-5 bg-white border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className={`text-sm ${isOverLimit ? 'text-rose-500' : 'text-slate-500'}`}>
          <span className="font-medium text-slate-700">{wordCount}</span>
          <span> / {maxWords} 字</span>
          {isOverLimit && <span className="ml-2 font-medium">超出限制</span>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isOverLimit || disabled}
          className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            {disabled ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                检测中...
              </>
            ) : (
              <>
                开始检测
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
});
