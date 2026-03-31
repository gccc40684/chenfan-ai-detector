/**
 * 历史记录管理 Hook
 * 使用 localStorage 存储最近 20 条检测记录
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 历史记录项
 */
export interface HistoryItem {
  /** 唯一标识 */
  id: string;
  /** 检测文本（截断存储） */
  text: string;
  /** 文本完整长度 */
  textLength: number;
  /** 检测结果 */
  result: {
    isAI: boolean;
    confidence: number;
    score: number;
    analysis: string;
    evidence?: string[];
    tags?: string[];
  };
  /** 检测方法 */
  method: 'heuristic' | 'llm' | 'hybrid';
  /** 处理时间（毫秒） */
  processingTime?: number;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 历史记录存储配置
 */
const STORAGE_KEY = 'ai-detector-history';
const MAX_HISTORY_ITEMS = 20;

/**
 * 截断文本用于存储
 */
function truncateText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 历史记录 Hook
 */
export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    // 从 localStorage 加载初始值
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        // 验证数据有效性
        const validItems = parsed.filter(
          (item): item is HistoryItem =>
            item &&
            typeof item.id === 'string' &&
            typeof item.text === 'string' &&
            typeof item.createdAt === 'string' &&
            item.result &&
            typeof item.result.isAI === 'boolean'
        );
        return validItems;
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
    return [];
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // 标记已加载
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save history to localStorage:', error);
      }
    }
  }, [history, isLoaded]);

  /**
   * 添加历史记录
   */
  const addHistory = useCallback(
    (
      text: string,
      result: HistoryItem['result'],
      method: HistoryItem['method'],
      processingTime?: number
    ): HistoryItem => {
      const newItem: HistoryItem = {
        id: generateId(),
        text: truncateText(text),
        textLength: text.length,
        result,
        method,
        processingTime,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        // 去重：如果文本相同且结果相同，先移除旧记录
        const filtered = prev.filter(
          (item) =>
            !(item.text === newItem.text && item.result.isAI === newItem.result.isAI)
        );
        // 添加到开头，限制数量
        return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      });

      return newItem;
    },
    []
  );

  /**
   * 删除单条历史记录
   */
  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * 清空所有历史记录
   */
  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('确定要清空所有历史记录吗？此操作不可恢复。');
      if (confirmed) {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  /**
   * 根据 ID 获取历史记录
   */
  const getHistoryItem = useCallback(
    (id: string): HistoryItem | undefined => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  /**
   * 格式化时间显示
   */
  const formatTime = useCallback((isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  /**
   * 获取统计信息
   */
  const getStats = useCallback(() => {
    const total = history.length;
    const aiCount = history.filter((item) => item.result.isAI).length;
    const humanCount = total - aiCount;
    const hybridCount = history.filter((item) => item.method === 'hybrid').length;

    return {
      total,
      aiCount,
      humanCount,
      hybridCount,
    };
  }, [history]);

  return {
    /** 历史记录列表 */
    history,
    /** 是否已加载 */
    isLoaded,
    /** 添加历史记录 */
    addHistory,
    /** 删除单条记录 */
    deleteHistoryItem,
    /** 清空所有记录 */
    clearHistory,
    /** 根据 ID 获取记录 */
    getHistoryItem,
    /** 格式化时间 */
    formatTime,
    /** 获取统计信息 */
    getStats,
  };
}

export default useHistory;
