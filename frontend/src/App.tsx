import { useRef, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { TextInput, type TextInputRef } from './components/TextInput';
import { FileUpload } from './components/FileUpload';
import { HistoryList } from './components/HistoryList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useHistory } from './hooks/useHistory';
import { detectHybrid, type HybridDetectResult } from './utils/api';
import { detectAI } from './utils/detection/heuristicDetector';
import './styles/animations.css';

interface DetectionResult extends HybridDetectResult {
  processingTime?: number;
}

function App() {
  const textInputRef = useRef<TextInputRef>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');

  // 历史记录
  const { history, addHistory, deleteHistoryItem, clearHistory, formatTime, getStats } =
    useHistory();

  const handleFileParsed = (parsedText: string) => {
    textInputRef.current?.setText(parsedText);
  };

  const handleSubmit = async (text: string) => {
    const startTime = Date.now();
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStage('正在进行启发式检测...');

    try {
      // 使用混合检测策略
      const hybridResult = await detectHybrid(
        text,
        t => {
          const localResult = detectAI(t);
          setLoadingStage('启发式检测完成，正在分析...');
          return {
            isAI: localResult.isAI,
            confidence: localResult.confidence,
            score: localResult.score,
            features: localResult.features,
          };
        },
        {
          grayZoneThreshold: 0.2,
          highConfidenceThreshold: 0.75,
          useLLM: true,
        }
      );

      // 如果需要 LLM 检测，更新加载状态
      if (hybridResult.method === 'hybrid') {
        setLoadingStage('正在进行深度 LLM 分析...');
      }

      const processingTime = Date.now() - startTime;

      const finalResult = {
        ...hybridResult,
        processingTime,
      };

      setResult(finalResult);

      // 添加到历史记录
      addHistory(
        text,
        {
          isAI: finalResult.isAI,
          confidence: finalResult.confidence,
          score: finalResult.score,
          analysis: finalResult.analysis,
          evidence: finalResult.evidence,
          tags: finalResult.tags,
        },
        finalResult.method,
        processingTime
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '检测过程中发生错误');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // 从历史记录加载
  const handleHistoryItemClick = (item: ReturnType<typeof useHistory>['history'][0]) => {
    textInputRef.current?.setText(item.text);
    setResult({
      isAI: item.result.isAI,
      confidence: item.result.confidence,
      score: item.result.score,
      analysis: item.result.analysis,
      evidence: item.result.evidence,
      tags: item.result.tags,
      method: item.method,
      processingTime: item.processingTime,
    });
    setError(null);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 获取检测方法标签
  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'heuristic':
        return { text: '启发式检测', color: 'bg-blue-100 text-blue-700' };
      case 'llm':
        return { text: 'LLM 深度分析', color: 'bg-purple-100 text-purple-700' };
      case 'hybrid':
        return { text: '混合检测', color: 'bg-indigo-100 text-indigo-700' };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-700' };
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 md:py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧主内容区 */}
            <div className="lg:col-span-2 space-y-6">
              <HeroSection title="AI 内容检测器" subtitle="快速检测文本是否由 AI 生成" />

              {/* 文件上传区域 */}
              <div className="animate-fade-in animation-delay-100">
                <FileUpload onFileParsed={handleFileParsed} />
              </div>

              {/* 文本输入区域 */}
              <TextInput
                ref={textInputRef}
                maxWords={5000}
                onSubmit={handleSubmit}
                disabled={loading}
              />

              {/* 加载状态 */}
              {loading && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center animate-fade-in">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-blue-600 font-medium">
                        {loadingStage.includes('LLM') ? '深度' : '快速'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 font-medium">{loadingStage}</p>
                  <p className="mt-2 text-sm text-gray-500">请稍候，正在分析文本特征...</p>

                  {/* 进度条 */}
                  <div className="mt-4 max-w-xs mx-auto">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full animate-progress"
                        style={{ animationDuration: loadingStage.includes('LLM') ? '8s' : '2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-shake">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-red-500 flex-shrink-0"
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
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* 检测结果 */}
              {result && (
                <div className="bg-white rounded-lg shadow-md p-6 animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">检测结果</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getMethodLabel(result.method).color
                      }`}
                    >
                      {getMethodLabel(result.method).text}
                    </span>
                  </div>

                  {/* 主要结果 */}
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`px-6 py-3 rounded-full font-bold text-lg ${
                        result.isAI ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {result.isAI ? '🤖 AI 生成' : '👤 人类撰写'}
                    </div>
                    <div className={`text-lg font-medium ${getConfidenceColor(result.confidence)}`}>
                      置信度: {Math.round(result.confidence * 100)}%
                    </div>
                  </div>

                  {/* AI 可能性评分条 */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>AI 可能性</span>
                      <span>{Math.round(result.score * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          result.score > 0.7
                            ? 'bg-red-500'
                            : result.score > 0.4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${result.score * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>人类</span>
                      <span>不确定</span>
                      <span>AI</span>
                    </div>
                  </div>

                  {/* 分析说明 */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">分析说明</div>
                    <p className="text-gray-700 whitespace-pre-line">{result.analysis}</p>
                  </div>

                  {/* 特征标签 */}
                  {result.tags && result.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">检测到的特征</div>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 关键证据 */}
                  {result.evidence && result.evidence.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">关键证据</div>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        {result.evidence.map((item, index) => (
                          <li
                            key={index}
                            className="animate-slide-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 检测详情（仅在混合检测时显示） */}
                  {result.method === 'hybrid' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-3">检测详情</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {result.heuristicResult && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-blue-800 mb-1">启发式检测</div>
                            <div className="text-sm text-blue-700">
                              评分: {Math.round(result.heuristicResult.score * 100)}%
                            </div>
                            <div className="text-sm text-blue-700">
                              置信度: {Math.round(result.heuristicResult.confidence * 100)}%
                            </div>
                            <div className="text-sm text-blue-700">
                              结果: {result.heuristicResult.isAI ? 'AI' : '人类'}
                            </div>
                          </div>
                        )}
                        {result.llmResult && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-purple-800 mb-1">LLM 分析</div>
                            <div className="text-sm text-purple-700">
                              评分: {Math.round(result.llmResult.score * 100)}%
                            </div>
                            <div className="text-sm text-purple-700">
                              置信度: {Math.round(result.llmResult.confidence * 100)}%
                            </div>
                            <div className="text-sm text-purple-700">
                              结果: {result.llmResult.isAI ? 'AI' : '人类'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 处理时间 */}
                  {result.processingTime && (
                    <div className="mt-4 text-right text-xs text-gray-400">
                      处理时间: {result.processingTime}ms
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 右侧边栏 - 历史记录 */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <HistoryList
                  history={history}
                  formatTime={formatTime}
                  onDelete={deleteHistoryItem}
                  onClear={clearHistory}
                  onItemClick={handleHistoryItemClick}
                  defaultExpanded={false}
                />

                {/* 统计信息 */}
                {history.length > 0 && (
                  <div className="mt-4 bg-white rounded-lg shadow-sm p-4 animate-fade-in">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">检测统计</h4>
                    {(() => {
                      const stats = getStats();
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">总检测数</span>
                            <span className="font-medium">{stats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">AI 文本</span>
                            <span className="font-medium text-red-600">{stats.aiCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">人类文本</span>
                            <span className="font-medium text-green-600">{stats.humanCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">混合检测</span>
                            <span className="font-medium text-indigo-600">{stats.hybridCount}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
