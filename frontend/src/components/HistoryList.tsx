import { useState } from 'react';
import type { HistoryItem } from '../hooks/useHistory';

interface HistoryListProps {
  history: HistoryItem[];
  formatTime: (isoString: string) => string;
  onDelete: (id: string) => void;
  onClear: () => void;
  onItemClick?: (item: HistoryItem) => void;
}

export function HistoryList({
  history,
  formatTime,
  onDelete,
  onClear,
  onItemClick,
}: HistoryListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getResultColor = (isAI: boolean) => {
    return isAI ? 'text-rose-600' : 'text-emerald-600';
  };

  const getResultBg = (isAI: boolean) => {
    return isAI ? 'bg-rose-50' : 'bg-emerald-50';
  };

  const handleItemClick = (item: HistoryItem) => {
    setSelectedId(item.id);
    onItemClick?.(item);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  const previewText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-800">检测历史</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
          >
            清空
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center">
          <svg
            className="w-10 h-10 text-slate-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-slate-500">暂无历史记录</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          {history.map(item => {
            const isSelected = selectedId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`group px-4 py-3 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors hover:bg-slate-50 ${
                  isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50/60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${getResultBg(item.result.isAI).replace('bg-', 'bg-')}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${item.result.isAI ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{previewText(item.text)}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-sm font-semibold ${getResultColor(item.result.isAI)}`}>
                        {item.result.isAI ? 'AI' : '人类'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {Math.round(item.result.confidence * 100)}% 置信度
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-xs text-slate-400">{formatTime(item.createdAt)}</span>
                    <button
                      onClick={e => handleDelete(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all"
                      title="删除"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
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
    </div>
  );
}

export default HistoryList;
