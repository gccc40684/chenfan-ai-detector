import { useState, useRef, useCallback } from 'react';
import { detectAI } from '../utils/detection/heuristicDetector';
import { detectText } from '../utils/api';

interface DetectionResult {
  isAI: boolean;
  confidence: number;
  score: number;
  analysis: string;
  perplexityScore?: number;
  burstinessScore?: number;
}

export function MainDetector() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 10000;
  const charCount = text.length;
  const isOverLimit = charCount > maxChars;
  const isNearLimit = charCount > maxChars * 0.9;

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setText(text);
      setResult(null);
    } catch (error) {
      alert('文件读取失败');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleSubmit = async () => {
    if (text.length < 50) {
      alert('请输入至少 50 个字符');
      return;
    }

    if (isOverLimit) {
      alert('文本超出限制，请升级会员检测更多字数');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 先使用启发式检测
      const heuristicResult = detectAI(text);
      
      // 计算详细指标
      const perplexityScore = Math.round((1 - heuristicResult.features.diversity) * 100);
      const burstinessScore = Math.round(heuristicResult.features.burstiness * 100);

      // 如果置信度不高，调用 API
      if (heuristicResult.confidence < 0.8) {
        const apiResult = await detectText({ text });
        if (apiResult.success && apiResult.data) {
          setResult({
            isAI: apiResult.data.isAI,
            confidence: apiResult.data.confidence,
            score: apiResult.data.score,
            analysis: apiResult.data.analysis,
            perplexityScore,
            burstinessScore,
          });
        } else {
          setResult({
            isAI: heuristicResult.isAI,
            confidence: heuristicResult.confidence,
            score: heuristicResult.score,
            analysis: '基于启发式算法分析',
            perplexityScore,
            burstinessScore,
          });
        }
      } else {
        setResult({
          isAI: heuristicResult.isAI,
          confidence: heuristicResult.confidence,
          score: heuristicResult.score,
          analysis: '基于启发式算法分析',
          perplexityScore,
          burstinessScore,
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

  const getConfidenceText = (score: number) => {
    if (score > 0.7) return '极可能 AI 生成';
    if (score > 0.4) return '可能 AI 生成';
    return '极可能人类撰写';
  };

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return 'text-red-600 bg-red-50 border-red-200';
    if (score > 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 字数限制提示 */}
      {isNearLimit && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>字数接近限制，升级会员可检测更多字数</span>
          </div>
        </div>
      )}

      {/* 主输入区域 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* 拖拽上传区域 */}
        <div 
          className={`p-6 border-b border-gray-200 transition-colors ${isDragging ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".txt,.md,.docx,.pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📄 上传文件
                </button>
                <p className="mt-2 text-sm text-gray-500">支持 .txt, .md, .docx, .pdf 格式</p>
              </div>
              <div className="text-gray-400">或</div>
              <div className="flex-1">
                <div className="px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                  拖拽文件到此处
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 文本框 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="在此粘贴或输入您要检测的文本..."
            className="w-full h-64 p-6 text-gray-700 placeholder-gray-400 resize-none focus:outline-none text-base leading-relaxed"
            maxLength={maxChars * 1.1} // 允许输入超出，但会提示
          />

          {/* 清空按钮 */}
          {text.length > 0 && (
            <button
              onClick={clearText}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '1.25rem', height: '1.25rem' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm">
            <span className={isOverLimit ? 'text-red-500 font-medium' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}>
              {charCount.toLocaleString()}
            </span>
            <span className="text-gray-400"> / {maxChars.toLocaleString()} 字符</span>
            {isOverLimit && (
              <span className="ml-2 text-red-500">（超出限制）</span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || text.length < 50 || isOverLimit}
            className={`
              px-8 py-3 rounded-full font-medium text-white transition-all
              ${
                loading || text.length < 50 || isOverLimit
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg 
                  className="animate-spin h-4 w-4" 
                  viewBox="0 0 24 24"
                  style={{ width: '1rem', height: '1rem' }}
                >
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
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
          {/* 等级提示条 */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">免费版</span>
              <span className="text-sm text-gray-500">剩余 49 次检测</span>
            </div>
          </div>

          {/* 主要结果 */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-2 px-8 py-4 rounded-full text-2xl font-bold border-2 ${getConfidenceColor(result.score)}`}>
                {result.isAI ? (
                  <>
                    <svg 
                      className="w-8 h-8" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ width: '2rem', height: '2rem' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {getConfidenceText(result.score)}
                  </>
                ) : (
                  <>
                    <svg 
                      className="w-8 h-8" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ width: '2rem', height: '2rem' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {getConfidenceText(result.score)}
                  </>
                )}
              </div>
            </div>

            {/* AI 概率大数字 */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                {Math.round(result.score * 100)}%
              </div>
              <div className="text-gray-500">AI 生成概率</div>
            </div>

            {/* 详细指标 */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Perplexity 分数</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.perplexityScore || 0}
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${result.perplexityScore || 0}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">文本可预测性</div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Burstiness 分数</div>
                <div className="text-2xl font-bold text-gray-900">
                  {result.burstinessScore || 0}
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${result.burstinessScore || 0}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">句子长度变化</div>
              </div>
            </div>

            {/* 分析说明 */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">分析说明</h4>
              <p className="text-gray-700 leading-relaxed">{result.analysis}</p>
            </div>
          </div>

          {/* 升级提示 */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                升级会员可检测更长文本、查看详细报告
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                升级会员
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 功能特点三栏介绍 */}
      <div className="mt-16 mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">功能特点</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">支持多格式</h3>
            <p className="text-gray-600">支持 .txt, .md, .docx, .pdf 文件上传检测</p>
          </div>

          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">长文本检测</h3>
            <p className="text-gray-600">最高支持 10 万字长文检测，满足专业需求</p>
          </div>

          <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">隐私保护</h3>
            <p className="text-gray-600">本地解析不上传，保护您的敏感内容</p>
          </div>
        </div>
      </div>

      {/* 会员等级对比表 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">会员方案</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 免费版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">免费版</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">¥0</div>
              <div className="text-sm text-gray-500">/月</div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                2,000 字/次
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50 次/月
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                基础检测
              </li>
            </ul>
            <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              当前方案
            </button>
          </div>

          {/* 基础版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">基础版</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">¥19</div>
              <div className="text-sm text-gray-500">/月</div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                10,000 字/次
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                200 次/月
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                详细报告
              </li>
            </ul>
            <button className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              立即升级
            </button>
          </div>

          {/* 专业版 */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-500 p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">推荐</span>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">专业版</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">¥49</div>
              <div className="text-sm text-gray-500">/月</div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50,000 字/次
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                无限检测
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                可疑段落高亮
              </li>
            </ul>
            <button className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
              立即升级
            </button>
          </div>

          {/* 团队版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">团队版</h3>
              <div className="text-3xl font-bold text-gray-900 mt-2">¥199</div>
              <div className="text-sm text-gray-500">/月</div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100,000 字/次
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                无限检测
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                API 接入
              </li>
            </ul>
            <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              联系我们
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
