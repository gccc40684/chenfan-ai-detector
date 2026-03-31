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
    } catch {
      alert('文件读取失败');
    }
  }, []);

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
      const heuristicResult = detectAI(text);
      const perplexityScore = Math.round((1 - heuristicResult.features.diversity) * 100);
      const burstinessScore = Math.round(heuristicResult.features.burstiness * 100);

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

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 主输入区域 - GPTZero 风格 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* 文本框 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="在此粘贴或输入您要检测的文本..."
            className="w-full h-80 p-8 text-gray-800 placeholder-gray-400 resize-none focus:outline-none text-lg leading-relaxed border-0"
            maxLength={maxChars * 1.1}
          />

          {/* 清空按钮 */}
          {text.length > 0 && (
            <button
              onClick={clearText}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
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

        {/* 底部工具栏 - GPTZero 风格 */}
        <div className="flex items-center justify-between px-8 py-5 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-6">
            {/* 字数统计 */}
            <div className="text-sm">
              <span className={`font-medium ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-700'}`}>
                {charCount.toLocaleString()}
              </span>
              <span className="text-gray-400"> / {maxChars.toLocaleString()} 字符</span>
            </div>

            {/* 上传按钮 */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".txt,.md,.docx,.pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                上传文件
              </button>
              <span className="text-xs text-gray-400">支持 .txt, .md, .docx, .pdf</span>
            </div>
          </div>

          {/* 检测按钮 - GPTZero 风格渐变按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading || text.length < 50 || isOverLimit}
            className={`
              px-8 py-3 rounded-full font-semibold text-white transition-all
              ${
                loading || text.length < 50 || isOverLimit
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
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

      {/* 字数限制提示 */}
      {isNearLimit && !isOverLimit && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ⚠️ 字数接近限制，升级会员可检测更多字数
        </div>
      )}
      {isOverLimit && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ 文本超出限制，请升级会员检测更多字数
        </div>
      )}

      {/* 检测结果 - GPTZero 风格 */}
      {result && (
        <div className="mt-10 animate-fade-in">
          {/* 结果卡片 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* 结果标题 */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="text-center">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-xl font-bold ${
                  result.isAI 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
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
            </div>

            {/* 主要内容 */}
            <div className="p-8">
              {/* AI 概率大数字 - GPTZero 风格 */}
              <div className="text-center mb-10">
                <div className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {Math.round(result.score * 100)}%
                </div>
                <div className="text-gray-500 mt-2 text-lg">AI 生成概率</div>
              </div>

              {/* 详细指标 */}
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-600 mb-3">Perplexity 分数</div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {result.perplexityScore || 0}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${result.perplexityScore || 0}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">文本可预测性</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="text-sm font-medium text-gray-600 mb-3">Burstiness 分数</div>
                  <div className="text-3xl font-bold text-gray-800 mb-2">
                    {result.burstinessScore || 0}
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${result.burstinessScore || 0}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">句子长度变化</div>
                </div>
              </div>

              {/* 分析说明 */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">分析说明</h4>
                <p className="text-gray-700 leading-relaxed">{result.analysis}</p>
              </div>
            </div>

            {/* 升级提示 - GPTZero 风格 */}
            <div className="px-8 py-5 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  升级会员可检测更长文本、查看详细报告、解锁更多功能
                </div>
                <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                  升级会员
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 功能特点 - GPTZero 风格 */}
      <div className="mt-20 mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">功能特点</h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          专业级 AI 内容检测工具，为您提供准确、可靠的检测服务
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">支持多格式</h3>
            <p className="text-gray-600">支持 .txt, .md, .docx, .pdf 文件上传检测，满足各种场景需求</p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">长文本检测</h3>
            <p className="text-gray-600">最高支持 10 万字长文检测，满足学术论文、长篇内容等专业需求</p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">隐私保护</h3>
            <p className="text-gray-600">本地解析不上传，保护您的敏感内容安全，让您安心使用</p>
          </div>
        </div>
      </div>

      {/* 会员等级 - GPTZero 风格 */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">会员方案</h2>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
          选择适合您的方案，开始专业级 AI 内容检测
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 免费版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">免费版</h3>
              <div className="text-4xl font-bold text-gray-900 mt-3">¥0</div>
              <div className="text-sm text-gray-500 mt-1">/月</div>
            </div>
            <ul className="space-y-4 text-gray-600 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                2,000 字/次
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50 次/月
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                基础检测
              </li>
            </ul>
            <button className="w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              当前方案
            </button>
          </div>

          {/* 基础版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">基础版</h3>
              <div className="text-4xl font-bold text-gray-900 mt-3">¥19</div>
              <div className="text-sm text-gray-500 mt-1">/月</div>
            </div>
            <ul className="space-y-4 text-gray-600 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                10,000 字/次
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                200 次/月
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                详细报告
              </li>
            </ul>
            <button className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
              立即升级
            </button>
          </div>

          {/* 专业版 - 推荐 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-500 p-8 relative hover:shadow-xl transition-shadow">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                推荐
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">专业版</h3>
              <div className="text-4xl font-bold text-gray-900 mt-3">¥49</div>
              <div className="text-sm text-gray-500 mt-1">/月</div>
            </div>
            <ul className="space-y-4 text-gray-600 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                50,000 字/次
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                无限检测
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                可疑段落高亮
              </li>
            </ul>
            <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
              立即升级
            </button>
          </div>

          {/* 团队版 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">团队版</h3>
              <div className="text-4xl font-bold text-gray-900 mt-3">¥199</div>
              <div className="text-sm text-gray-500 mt-1">/月</div>
            </div>
            <ul className="space-y-4 text-gray-600 mb-8">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100,000 字/次
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                无限检测
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                API 接入
              </li>
            </ul>
            <button className="w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              联系我们
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
