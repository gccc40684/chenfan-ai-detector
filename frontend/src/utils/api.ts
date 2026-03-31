/**
 * API client for AI Detector Worker
 * 增强版：支持超时控制、错误处理和混合检测策略
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const DEFAULT_TIMEOUT = 15000; // 15秒超时
const LLM_TIMEOUT = 30000; // LLM 检测 30秒超时

export interface DetectRequest {
  text: string;
  detailLevel?: 'simple' | 'detailed';
}

export interface DetectResponse {
  success: boolean;
  data?: {
    isAI: boolean;
    confidence: number;
    score: number;
    analysis: string;
    evidence?: string[];
    tags?: string[];
  };
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface HybridDetectResult {
  isAI: boolean;
  confidence: number;
  score: number;
  analysis: string;
  evidence?: string[];
  tags?: string[];
  method: 'heuristic' | 'llm' | 'hybrid';
  heuristicResult?: {
    score: number;
    confidence: number;
    isAI: boolean;
    features: Record<string, number>;
  };
  llmResult?: {
    score: number;
    confidence: number;
    isAI: boolean;
  };
}

/**
 * 创建带超时的 fetch 请求
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs}ms）`);
    }
    throw error;
  }
}

/**
 * Check API health status
 */
export async function checkHealth(timeoutMs = 5000): Promise<HealthResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/health`,
    { method: 'GET' },
    timeoutMs
  );

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Detect if text is AI-generated using LLM API
 */
export async function detectWithLLM(
  request: DetectRequest,
  timeoutMs = LLM_TIMEOUT
): Promise<DetectResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/api/detect`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    },
    timeoutMs
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || `Request failed: ${response.status}`,
    };
  }

  return data;
}

/**
 * 启发式检测结果类型
 */
export interface HeuristicResult {
  isAI: boolean;
  confidence: number;
  score: number;
  features: Record<string, number>;
}

/**
 * 混合检测策略
 * 1. 先进行启发式检测（快速）
 * 2. 如果结果在灰色地带（置信度不够高），调用 LLM API 进行二次检测
 * 3. 融合两种结果
 */
export async function detectHybrid(
  text: string,
  heuristicDetectFn: (text: string) => HeuristicResult,
  options: {
    grayZoneThreshold?: number; // 灰色地带阈值，默认 0.2
    highConfidenceThreshold?: number; // 高置信度阈值，默认 0.75
    useLLM?: boolean; // 是否使用 LLM，默认 true
  } = {}
): Promise<HybridDetectResult> {
  const {
    grayZoneThreshold = 0.2,
    highConfidenceThreshold = 0.75,
    useLLM = true,
  } = options;

  // 第一步：启发式检测（本地，快速）
  const heuristicResult = heuristicDetectFn(text);

  // 判断是否在灰色地带
  const isGrayZone =
    heuristicResult.confidence < highConfidenceThreshold ||
    Math.abs(heuristicResult.score - 0.5) < grayZoneThreshold;

  // 如果不在灰色地带或禁用 LLM，直接返回启发式结果
  if (!isGrayZone || !useLLM) {
    return {
      isAI: heuristicResult.isAI,
      confidence: heuristicResult.confidence,
      score: heuristicResult.score,
      analysis: generateHeuristicAnalysis(heuristicResult),
      method: 'heuristic',
      heuristicResult: {
        score: heuristicResult.score,
        confidence: heuristicResult.confidence,
        isAI: heuristicResult.isAI,
        features: heuristicResult.features,
      },
    };
  }

  // 第二步：调用 LLM API 进行深度检测
  try {
    const llmResponse = await detectWithLLM({
      text,
      detailLevel: 'detailed', // 灰色地带使用详细分析
    });

    if (!llmResponse.success || !llmResponse.data) {
      // LLM 失败，回退到启发式结果
      return {
        isAI: heuristicResult.isAI,
        confidence: heuristicResult.confidence * 0.8, // 降低置信度
        score: heuristicResult.score,
        analysis: generateHeuristicAnalysis(heuristicResult) + '（LLM 分析失败，使用启发式结果）',
        method: 'heuristic',
        heuristicResult: {
          score: heuristicResult.score,
          confidence: heuristicResult.confidence,
          isAI: heuristicResult.isAI,
          features: heuristicResult.features,
        },
      };
    }

    const llmData = llmResponse.data;

    // 第三步：融合两种结果
    const fusedResult = fuseResults(heuristicResult, llmData);

    return {
      ...fusedResult,
      method: 'hybrid',
      heuristicResult: {
        score: heuristicResult.score,
        confidence: heuristicResult.confidence,
        isAI: heuristicResult.isAI,
        features: heuristicResult.features,
      },
      llmResult: {
        score: llmData.score,
        confidence: llmData.confidence,
        isAI: llmData.isAI,
      },
    };
  } catch (error) {
    // LLM 调用失败，回退到启发式结果
    console.warn('LLM detection failed:', error);
    return {
      isAI: heuristicResult.isAI,
      confidence: heuristicResult.confidence * 0.8,
      score: heuristicResult.score,
      analysis: generateHeuristicAnalysis(heuristicResult) + '（LLM 服务不可用，使用启发式结果）',
      method: 'heuristic',
      heuristicResult: {
        score: heuristicResult.score,
        confidence: heuristicResult.confidence,
        isAI: heuristicResult.isAI,
        features: heuristicResult.features,
      },
    };
  }
}

/**
 * 融合启发式和 LLM 结果
 */
function fuseResults(
  heuristic: HeuristicResult,
  llm: DetectResponse['data']
): Omit<HybridDetectResult, 'method' | 'heuristicResult' | 'llmResult'> {
  if (!llm) {
    return {
      isAI: heuristic.isAI,
      confidence: heuristic.confidence,
      score: heuristic.score,
      analysis: generateHeuristicAnalysis(heuristic),
    };
  }

  // 根据置信度加权融合
  const heuristicWeight = heuristic.confidence / (heuristic.confidence + llm.confidence);
  const llmWeight = llm.confidence / (heuristic.confidence + llm.confidence);

  // 融合分数（加权平均）
  const fusedScore = heuristic.score * heuristicWeight + llm.score * llmWeight;

  // 融合置信度（取较高的）
  const fusedConfidence = Math.max(heuristic.confidence, llm.confidence);

  // 最终判断
  const fusedIsAI = fusedScore >= 0.5;

  // 生成融合分析
  const analysis = generateHybridAnalysis(heuristic, llm, fusedScore, fusedIsAI);

  return {
    isAI: fusedIsAI,
    confidence: fusedConfidence,
    score: fusedScore,
    analysis,
    evidence: llm.evidence,
    tags: llm.tags,
  };
}

/**
 * 生成启发式分析文本
 */
function generateHeuristicAnalysis(result: HeuristicResult): string {
  const features = result.features;
  const parts: string[] = [];

  if (features.burstiness > 0.7) {
    parts.push('句子长度变化较小，呈现规律性');
  }
  if (features.diversity > 0.7) {
    parts.push('词汇多样性较低，用词较为单一');
  }
  if (features.patternDensity > 0.6) {
    parts.push('检测到较多 AI 常用模式');
  }
  if (features.repetition > 0.6) {
    parts.push('存在较多重复表达');
  }

  if (parts.length === 0) {
    parts.push('文本特征较为自然，未检测到明显的 AI 生成模式');
  }

  return `启发式检测分析：${parts.join('；')}。综合评分 ${Math.round(result.score * 100)}%。`;
}

/**
 * 生成混合分析文本
 */
function generateHybridAnalysis(
  heuristic: HeuristicResult,
  llm: DetectResponse['data'],
  fusedScore: number,
  fusedIsAI: boolean
): string {
  const parts: string[] = [];

  // LLM 分析
  if (llm?.analysis) {
    parts.push(llm.analysis);
  }

  // 一致性说明
  const heuristicSaysAI = heuristic.score >= 0.5;
  const llmSaysAI = llm?.isAI ?? false;

  if (heuristicSaysAI === llmSaysAI) {
    parts.push(`启发式检测与 LLM 分析结果一致（${fusedIsAI ? 'AI生成' : '人类撰写'}）。`);
  } else {
    parts.push(`启发式检测与 LLM 分析结果存在分歧，综合判断为${fusedIsAI ? 'AI生成' : '人类撰写'}。`);
  }

  return parts.join('\n');
}

/**
 * 简单的 API 检测（带 fallback）
 * @deprecated 推荐使用 detectHybrid
 */
export async function detectWithFallback(
  text: string,
  localDetectFn: (text: string) => { isAI: boolean; confidence: number; score: number }
): Promise<DetectResponse> {
  try {
    // Try API first
    const result = await detectWithLLM({ text, detailLevel: 'simple' });
    if (result.success) {
      return result;
    }
    throw new Error(result.error || 'API detection failed');
  } catch (error) {
    console.warn('API detection failed, falling back to local detection:', error);

    // Fall back to local detection
    const localResult = localDetectFn(text);

    return {
      success: true,
      data: {
        isAI: localResult.isAI,
        confidence: localResult.confidence,
        score: localResult.score,
        analysis: '使用本地启发式算法检测（API 不可用）',
      },
    };
  }
}
