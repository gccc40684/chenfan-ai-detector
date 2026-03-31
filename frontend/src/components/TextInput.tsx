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

  // 暴露方法给父组件
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
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="relative group">
        <textarea
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder="在此输入或粘贴您要检测的文本..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        />
        {/* 空状态提示 */}
        {!text && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <p className="text-sm">输入文本开始检测</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
          <span className="font-medium">{wordCount}</span>
          <span> / {maxWords} 字</span>
          {isOverLimit && <span className="ml-2">（超出限制）</span>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isOverLimit}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          aria-busy={disabled}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            开始检测
          </span>
        </button>
      </div>
    </div>
  );
});
