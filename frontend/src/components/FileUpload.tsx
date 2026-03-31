import { useState, useCallback, useRef } from 'react';
import { parseFile, getSupportedFileTypes, isSupportedFile } from '../utils/fileParser';

interface FileUploadProps {
  onFileParsed: (text: string) => void;
  maxFileSize?: number; // in MB
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

      // 重置 input 以便可以重复选择同一文件
      e.target.value = '';
    },
    [handleParseFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'parsing':
        return 'border-blue-500 bg-blue-50';
      default:
        return isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'parsing':
        return (
          <svg
            className="w-8 h-8 text-blue-500 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        );
    }
  };

  return (
    <div className="w-full">
      <div
        onClick={status === 'idle' ? handleClick : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all duration-200 cursor-pointer
          ${getStatusColor()}
          ${status !== 'idle' ? 'cursor-default' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.docx,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">{getStatusIcon()}</div>

          {status === 'idle' && (
            <>
              <p className="text-lg font-medium text-gray-700 mb-2">拖拽文件到此处，或点击上传</p>
              <p className="text-sm text-gray-500">支持 {getSupportedFileTypes()} 格式</p>
              <p className="text-xs text-gray-400 mt-1">单个文件最大 {maxFileSize}MB</p>
            </>
          )}

          {status === 'parsing' && (
            <>
              <p className="text-lg font-medium text-blue-700 mb-1">{fileName}</p>
              <p className="text-sm text-blue-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <p className="text-lg font-medium text-green-700 mb-1">{fileName}</p>
              <p className="text-sm text-green-600 mb-3">{message}</p>
              <button
                onClick={e => {
                  e.stopPropagation();
                  resetState();
                }}
                className="text-sm text-green-700 underline hover:text-green-800"
              >
                上传其他文件
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-lg font-medium text-red-700 mb-1">{fileName || '上传失败'}</p>
              <p className="text-sm text-red-600 mb-3">{message}</p>
              <button
                onClick={e => {
                  e.stopPropagation();
                  resetState();
                }}
                className="text-sm text-red-700 underline hover:text-red-800"
              >
                重试
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
