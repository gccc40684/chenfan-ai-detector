import { useRef, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { TextInput, type TextInputRef } from './components/TextInput';
import { FileUpload } from './components/FileUpload';
import { HistoryList } from './components/HistoryList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircularProgress } from './components/CircularProgress';
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
  const [showDetails, setShowDetails] = useState(false);

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
    setShowDetails(false);
    setLoadingStage('正在进行启发式检测...');

    try {
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

      if (hybridResult.method === 'hybrid') {
        setLoadingStage('正在进行深度 LLM 分析...');
      }

      const processingTime = Date.now() - startTime;

      const finalResult = {
        ...hybridResult,
        processingTime,
      };

      setResult(finalResult);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreColor = (score: number) => {
    if (score > 0.7) return '#f43f5e';
    if (score > 0.4) return '#f59e0b';
    return '#10b981';
  };

  const stats = getStats();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <HeroSection
                title="AI 内容检测器"
                subtitle="快速、准确地检测文本是否由 AI 生成。支持文章、论文、邮件等多种内容形式。"
              />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
                <FileUpload onFileParsed={handleFileParsed} />
                <TextInput
                  ref={textInputRef}
                  maxWords={5000}
                  onSubmit={handleSubmit}
                  disabled={loading}
                />
              </div>

              {loading && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-5">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-slate-700 font-medium">{loadingStage}</p>
                  <p className="mt-2 text-sm text-slate-400">请稍候，正在分析文本特征...</p>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-rose-500 flex-shrink-0"
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
                    <p className="text-rose-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
                  <div className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">检测结果</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 self-start">
                        {result.method === 'heuristic' && '启发式检测'}
                        {result.method === 'llm' && 'LLM 分析'}
                        {result.method === 'hybrid' && '混合检测'}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-8 mb-8">
                      <div className="flex flex-col items-center">
                        <CircularProgress
                          value={result.confidence * 100}
                          label={`${Math.round(result.confidence * 100)}%`}
                          subLabel="置信度"
                          color={getScoreColor(result.score)}
                        />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div
                          className={`text-4xl md:text-5xl font-bold mb-2 ${result.isAI ? 'text-rose-600' : 'text-emerald-600'}`}
                        >
                          {result.isAI ? 'AI 生成' : '人类撰写'}
                        </div>
                        <p className="text-slate-500">
                          AI 可能性评分 {Math.round(result.score * 100)}%
                        </p>
                        {result.processingTime && (
                          <p className="text-xs text-slate-400 mt-2">
                            处理时间 {result.processingTime}ms
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-5 mb-6">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">分析说明</h4>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {result.analysis}
                      </p>
                    </div>

                    {result.tags && result.tags.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">检测到的特征</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.evidence && result.evidence.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">关键证据</h4>
                        <ul className="space-y-2">
                          {result.evidence.map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.method === 'hybrid' && (
                      <div>
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          {showDetails ? '收起详细分析' : '查看详细分析'}
                          <svg
                            className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {showDetails && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                            {result.heuristicResult && (
                              <div className="bg-blue-50 rounded-xl p-4">
                                <div className="text-sm font-semibold text-blue-800 mb-2">
                                  启发式检测
                                </div>
                                <div className="space-y-1 text-sm text-blue-700">
                                  <div className="flex justify-between">
                                    <span>评分</span>
                                    <span className="font-medium">
                                      {Math.round(result.heuristicResult.score * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>置信度</span>
                                    <span className="font-medium">
                                      {Math.round(result.heuristicResult.confidence * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>结果</span>
                                    <span className="font-medium">
                                      {result.heuristicResult.isAI ? 'AI' : '人类'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            {result.llmResult && (
                              <div className="bg-violet-50 rounded-xl p-4">
                                <div className="text-sm font-semibold text-violet-800 mb-2">
                                  LLM 分析
                                </div>
                                <div className="space-y-1 text-sm text-violet-700">
                                  <div className="flex justify-between">
                                    <span>评分</span>
                                    <span className="font-medium">
                                      {Math.round(result.llmResult.score * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>置信度</span>
                                    <span className="font-medium">
                                      {Math.round(result.llmResult.confidence * 100)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>结果</span>
                                    <span className="font-medium">
                                      {result.llmResult.isAI ? 'AI' : '人类'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-4">
                <HistoryList
                  history={history}
                  formatTime={formatTime}
                  onDelete={deleteHistoryItem}
                  onClear={clearHistory}
                  onItemClick={handleHistoryItemClick}
                />

                {history.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h4 className="text-sm font-semibold text-slate-800 mb-4">检测统计</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">总检测数</span>
                        <span className="font-semibold text-slate-800">{stats.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">AI 文本</span>
                        <span className="font-semibold text-rose-600">{stats.aiCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">人类文本</span>
                        <span className="font-semibold text-emerald-600">{stats.humanCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">混合检测</span>
                        <span className="font-semibold text-indigo-600">{stats.hybridCount}</span>
                      </div>
                    </div>
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
