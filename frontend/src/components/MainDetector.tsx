import { useState, useRef } from 'react';
import { detectAI } from '../utils/detection/heuristicDetector';
import { detectText } from '../utils/api';

interface DetectionResult {
  isAI: boolean;
  confidence: number;
  score: number;
  analysis: string;
}

export function MainDetector() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 10000;
  const charCount = text.length;

  const handleSubmit = async () => {
    if (text.length < 50) {
      alert('请输入至少 50 个字符');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 先使用启发式检测
      const heuristicResult = detectAI(text);
      
      // 如果置信度不高，调用 API
      if (heuristicResult.confidence < 0.8) {
        const apiResult = await detectText({ text });
        if (apiResult.success && apiResult.data) {
          setResult({
            isAI: apiResult.data.isAI,
            confidence: apiResult.data.confidence,
            score: apiResult.data.score,
            analysis: apiResult.data.analysis,
          });
        } else {
          // API 失败，使用启发式结果
          setResult({
            isAI: heuristicResult.isAI,
            confidence: heuristicResult.confidence,
            score: heuristicResult.score,
            analysis: '基于启发式算法分析',
          });
        }
      } else {
        // 启发式结果置信度高，直接使用
        setResult({
          isAI: heuristicResult.isAI,
          confidence: heuristicResult.confidence,
          score: heuristicResult.score,
          analysis: '基于启发式算法分析',
        });
      }
    } catch (error) {
      console.error('检测失败:', error);
      alert('检测失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const clearText = () => {
    setText('');
    setResult(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 输入区域 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 文本框 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此粘贴或输入您要检测的文本..."
            className="w-full h-64 p-6 text-gray-700 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
            maxLength={maxChars}
          />
          
          {/* 清空按钮 */}
          {text.length > 0 && (
            <button
              onClick={clearText}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <span className={charCount > maxChars * 0.9 ? 'text-red-500 font-medium' : ''}>
              {charCount.toLocaleString()}
            </span>
            <span className="text-gray-400"> / {maxChars.toLocaleString()} 字符</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || text.length < 50}
            className={`
              px-8 py-3 rounded-full font-medium text-white transition-all
              ${loading || text.length < 50
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                检测中...
              </span>
            ) : (
              '检测文本'
            )}
          </button>
        </div>
      </div>

      {/* 检测结果 */}
      {result && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-bold
              ${result.isAI 
                ? 'bg-red-50 text-red-600 border-2 border-red-100' 
                : 'bg-green-50 text-green-600 border-2 border-green-100'
              }
            `}>
              {result.isAI ? (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  疑似 AI 生成
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  疑似人类撰写
                </>
              )}
            </div>
          </div>

          {/* 置信度 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>置信度</span>
              <span className="font-medium">{Math.round(result.confidence * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.confidence > 0.7 
                    ? 'bg-green-500' 
                    : result.confidence > 0.4 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
                style={{ width: `${result.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* AI 可能性 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>AI 可能性</span>
              <span className="font-medium">{Math.round(result.score * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.score > 0.7 
                    ? 'bg-red-500' 
                    : result.score > 0.4 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${result.score * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>人类</span>
              <span>不确定</span>
              <span>AI</span>
            </div>
          </div>

          {/* 分析说明 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">分析说明</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{result.analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
