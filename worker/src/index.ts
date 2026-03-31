// Cloudflare Worker for AI Content Detection
// Integrates with OpenRouter API for LLM-based detection

export interface Env {
  OPENROUTER_API_KEY: string;
}

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with specific domain
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Simple response helper
function jsonResponse(data: unknown, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

// Error response helper
function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// Validate detection request
function validateDetectRequest(body: unknown): { text: string; detailLevel?: 'simple' | 'detailed' } {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体必须是 JSON 对象');
  }

  const { text, detailLevel } = body as Record<string, unknown>;

  if (!text || typeof text !== 'string') {
    throw new Error('text 字段是必需的且必须是字符串');
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    throw new Error('文本不能为空');
  }

  if (trimmedText.length < 50) {
    throw new Error('文本长度至少需要 50 个字符');
  }

  if (trimmedText.length > 10000) {
    throw new Error('文本长度不能超过 10000 个字符');
  }

  // Validate detailLevel if provided
  if (detailLevel !== undefined && detailLevel !== 'simple' && detailLevel !== 'detailed') {
    throw new Error('detailLevel 必须是 "simple" 或 "detailed"');
  }

  return { text: trimmedText, detailLevel: detailLevel as 'simple' | 'detailed' | undefined };
}

// Build prompt for OpenRouter
function buildPrompt(text: string, detailLevel: 'simple' | 'detailed' = 'simple'): string {
  // 中文特化检测指标
  const chineseSpecificMetrics = `
中文文本特化检测指标：
1. 成语使用：AI生成文本常过度使用成语或四字词语
2. 连接词模式："首先/其次/此外/综上所述"等模板化过渡词
3. 句式整齐度：段落内句子长度过于均匀（如都控制在15-25字）
4. 修辞平衡：比喻、排比等修辞手法的规律性分布
5. 情感表达：是否缺乏主观情感词（如"我觉得""令人困惑的是"）
6. 具体细节：是否缺少具体时间、地点、人物等细节描述
7. 口语化程度：是否完全没有口语化表达或方言词汇`;

  const basePrompt = `你是一个专业的 AI 内容检测专家，擅长识别中文 AI 生成文本。请分析以下文本，判断它是否由 AI 生成。

${chineseSpecificMetrics}

需要分析的文本：
"""
${text}
"""

通用检测维度：
1. 语言风格：是否过于正式、模板化或缺乏个性
2. 句式结构：句子长度是否过于均匀，变化是否太少
3. 词汇多样性：词汇使用是否重复，是否缺乏变化
4. 逻辑连贯性：段落结构是否过于规整
5. 人类特征：是否包含口语化表达、情感波动或个人经历

`;

  if (detailLevel === 'detailed') {
    return basePrompt + `请提供详细的分析报告，包括：
- 总体判断（AI生成 / 人类撰写 / 不确定）
- 置信度（0-100%）
- AI可能性评分（0-1，越接近1越可能是AI）
- 详细分析（针对上述每个维度和中文特化指标的具体观察）
- 关键证据（指出文本中具体的可疑或可信之处，至少3条）
- 特征标签（如["模板化过渡词", "句式均匀", "缺乏情感"]等）

请以 JSON 格式返回结果：
{
  "isAI": boolean,
  "confidence": number,
  "score": number,
  "analysis": "详细分析文本",
  "evidence": ["证据1", "证据2", "证据3"],
  "tags": ["标签1", "标签2"]
}`;
  }

  return basePrompt + `请给出简洁的判断结果。

请以 JSON 格式返回结果：
{
  "isAI": boolean,
  "confidence": number,
  "score": number,
  "analysis": "简要分析（2-3句话，指出最突出的特征）"
}`;
}

// Call OpenRouter API with retry logic
async function callOpenRouter(
  prompt: string,
  apiKey: string,
  retries = 3
): Promise<{
  isAI: boolean;
  confidence: number;
  score: number;
  analysis: string;
  evidence?: string[];
  tags?: string[];
}> {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const body = {
    model: 'anthropic/claude-3-haiku',  // Fast and cost-effective
    messages: [
      {
        role: 'system',
        content: '你是一个专业的 AI 内容检测专家。只返回 JSON 格式的结果，不要添加任何其他文本。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.1,  // Low temperature for consistent results
    max_tokens: 800,
    response_format: { type: 'json_object' }
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ai-detector.example.com',
          'X-Title': 'AI Content Detector'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenRouter');
      }

      // Parse JSON response
      const result = JSON.parse(content) as {
        isAI: boolean;
        confidence: number;
        score: number;
        analysis: string;
        evidence?: string[];
        tags?: string[];
      };

      // Validate result
      if (typeof result.isAI !== 'boolean') {
        throw new Error('Invalid response format: isAI must be boolean');
      }

      // Normalize confidence and score to 0-1 range
      result.confidence = Math.min(Math.max(result.confidence / 100, 0), 1);
      result.score = Math.min(Math.max(result.score, 0), 1);

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to call OpenRouter API');
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Health check endpoint
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // Main detection endpoint
    if (path === '/api/detect' && request.method === 'POST') {
      try {
        // Check API key
        if (!env.OPENROUTER_API_KEY) {
          return errorResponse('服务器配置错误：缺少 API 密钥', 500);
        }

        // Parse request body
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse('无效的 JSON 请求体');
        }

        // Validate request
        const { text, detailLevel } = validateDetectRequest(body);

        // Build prompt and call OpenRouter
        const prompt = buildPrompt(text, detailLevel);
        const result = await callOpenRouter(prompt, env.OPENROUTER_API_KEY);

        // Return success response
        return jsonResponse({
          success: true,
          data: {
            isAI: result.isAI,
            confidence: result.confidence,
            score: result.score,
            analysis: result.analysis,
            ...(result.evidence && { evidence: result.evidence }),
            ...(result.tags && { tags: result.tags })
          }
        });

      } catch (error) {
        console.error('Detection error:', error);
        const message = error instanceof Error ? error.message : '检测过程中发生错误';
        return errorResponse(message, 500);
      }
    }

    // 404 for unknown routes
    return errorResponse('Not Found', 404);
  }
};