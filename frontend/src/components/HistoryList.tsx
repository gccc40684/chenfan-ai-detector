import { useState } from 'react';
import type { HistoryItem } from '../hooks/useHistory';

interface HistoryListProps {
  /** 历史记录列表 */
  history: HistoryItem[];
  /** 格式化时间函数 */
  formatTime: (isoString: string) => string;
  /** 删除单条记录 */
  onDelete: (id: string) => void;
  /** 清空所有记录 */
  onClear: () => void;
  /** 点击记录回调 */
  onItemClick?: (item: HistoryItem) => void;
  /** 是否展开（默认收起） */
  defaultExpanded?: boolean;
}

/**
 * 历史记录列表组件
 */
export function HistoryList({
  history,
  formatTime,
  onDelete,
  onClear,
  onItemClick,
  defaultExpanded = false,
}: HistoryListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 获取检测方法显示文本
  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'heuristic':
        return { text: '启发式', color: 'bg-blue-100 text-blue-700' };
      case 'llm':
        return { text: 'LLM', color: 'bg-purple-100 text-purple-700' };
      case 'hybrid':
        return { text: '混合', color: 'bg-indigo-100 text-indigo-700' };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-700' };
    }
  };

  // 获取结果标签
  const getResultBadge = (isAI: boolean, confidence: number) => {
    if (isAI) {
      return {
        text: '🤖 AI',
        color: confidence > 0.8 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700',
      };
    }
    return {
      text: '👤 人类',
      color: confidence > 0.8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
    };
  };

  // 处理点击记录
  const handleItemClick = (item: HistoryItem) => {
    setSelectedId(item.id);
    onItemClick?.(item);
  };

  // 处理删除
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  // 空状态
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-medium text-gray-700 mb-1">暂无历史记录</h3>
        <p className="text-sm text-gray-500">开始检测文本，记录将显示在这里</p>
      </div>
    );
  }

  // 预览文本（限制长度）
  const previewText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* 头部 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-medium text-gray-700">检测历史</h3>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                onClear();
              }}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              title="清空历史"
            >
              清空
            </button>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 列表内容 */}
      {expanded && (
        <div className="max-h-96 overflow-y-auto">
          {history.map((item, index) => {
            const method = getMethodLabel(item.method);
            const result = getResultBadge(item.result.isAI, item.result.confidence);
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                }`}
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* 左侧：预览文本 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{previewText(item.text)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {/* 结果标签 */}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${result.color}`}>
                        {result.text}
                      </span>
                      {/* 方法标签 */}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${method.color}`}>
                        {method.text}
                      </span>
                      {/* 置信度 */}
                      <span className="text-xs text-gray-500">
                        {Math.round(item.result.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* 右侧：时间和删除按钮 */}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{formatTime(item.createdAt)}</span>
                    <button
                      onClick={e => handleDelete(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="删除"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 收起状态显示最新一条 */}
      {!expanded && history.length > 0 && (
        <div
          className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpanded(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const latest = history[0];
                const result = getResultBadge(latest.result.isAI, latest.result.confidence);
                return (
                  <>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${result.color}`}>
                      {result.text}
                    </span>
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                      {previewText(latest.text, 40)}
                    </span>
                  </>
                );
              })()}
            </div>
            <span className="text-xs text-gray-400">{formatTime(history[0].createdAt)}</span>
          </div>
        </div>
      )}

      {/* CSS 动画 */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default HistoryList;
