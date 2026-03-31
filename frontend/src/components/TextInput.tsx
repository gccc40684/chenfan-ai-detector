import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
}

export const TextInput = forwardRef<TextInputRef, TextInputProps>(
  function TextInput({ maxWords = 5000, onTextChange, onSubmit }, ref) {
    const [text, setTextState] = useState('');
    const textRef = useRef(text);

    // 保持 ref 同步
    textRef.current = text;

    const setText = useCallback((newText: string) => {
      setTextState(newText);
      onTextChange?.(newText);
    }, [onTextChange]);

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      setText,
      getText: () => textRef.current,
      clear: () => setText(''),
    }), [setText]);

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
      if (text.trim() && !isOverLimit) {
        onSubmit?.(text);
      }
    }, [text, isOverLimit, onSubmit]);

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="relative">
          <textarea
            value={text}
            onChange={handleChange}
            placeholder="在此输入或粘贴您要检测的文本..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          />
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
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            开始检测
          </button>
        </div>
      </div>
    );
  }
);
