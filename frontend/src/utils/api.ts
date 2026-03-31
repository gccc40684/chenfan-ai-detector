const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface DetectRequest {
  text: string;
}

export interface DetectResponse {
  success: boolean;
  data?: {
    isAI: boolean;
    confidence: number;
    score: number;
    analysis: string;
  };
  error?: string;
}

export async function detectText(request: DetectRequest): Promise<DetectResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `请求失败: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}
