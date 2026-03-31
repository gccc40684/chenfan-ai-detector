import { useState, useCallback, useRef } from 'react';
import { parseFile, getSupportedFileTypes, isSupportedFile } from '../utils/fileParser';

interface FileUploadProps {
  onFileParsed: (text: string) => void;
  maxFileSize?: number;
}

type UploadStatus = 'idle' | 'parsing' | 'success' | 'error';

export function FileUpload({ onFileParsed, maxFileSize = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setFileName('');
  }, []);

  const handleParseFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setStatus('parsing');
      setMessage('正在解析文件...');

      const result = await parseFile(file);

      if (result.success) {
        setStatus('success');
        setMessage(`成功解析 ${file.name}`);
        onFileParsed(result.text);
      } else {
        setStatus('error');
        setMessage(result.error || '解析失败');
      }
    },
    [onFileParsed]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];

      if (!isSupportedFile(file)) {
        setStatus('error');
        setMessage(`不支持的文件类型。支持的类型：${getSupportedFileTypes()}`);
        return;
      }

      handleParseFile(file);
    },
    [handleParseFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      handleParseFile(file);
      e.target.value = '';
    },
    [handleParseFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="flex-1 truncate">{fileName} 上传成功</span>
        <button
          onClick={resetState}
          className="text-emerald-700 hover:text-emerald-800 font-medium"
        >
          重新上传
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 text-rose-700 rounded-xl text-sm">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="flex-1 truncate">{message}</span>
        <button onClick={resetState} className="text-rose-700 hover:text-rose-800 font-medium">
          重试
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border border-dashed rounded-xl px-4 py-3
        transition-all duration-200 cursor-pointer
        ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-white hover:border-slate-400'}
        ${status === 'parsing' ? 'cursor-default border-indigo-500 bg-indigo-50/50' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.docx,.pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        {status === 'parsing' ? (
          <svg
            className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          {status === 'parsing' ? (
            <span className="text-sm text-slate-600">正在解析 {fileName}...</span>
          ) : (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <span className="font-medium text-indigo-600">点击上传</span>
              <span>或拖拽文件到此处</span>
            </div>
          )}
          {status !== 'parsing' && (
            <p className="text-xs text-slate-400 mt-0.5">
              支持 {getSupportedFileTypes()} · 最大 {maxFileSize}MB
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
