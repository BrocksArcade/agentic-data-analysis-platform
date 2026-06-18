import { useState, useRef } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import { ChevronIcon, PlusIcon } from './icons';

export default function Sidebar() {
  const { conversations, currentConversationId, selectConversation, handleFileUpload } = useDashboard();
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bgClass = theme === 'dark' ? 'bg-dark-800' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-dark-700' : 'border-gray-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`${bgClass} ${borderClass} border-r flex flex-col h-full transition-all duration-300 overflow-hidden`}
      style={{ width: collapsed ? '60px' : '280px' }}
    >
      {/* Header */}
      <div className={`${borderClass} border-b p-4 flex items-center justify-between gap-2`}>
        {!collapsed && <h2 className={`text-lg font-bold ${textClass}`}>Data Analysis</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 transition"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronIcon dir={collapsed ? 'right' : 'left'} className="w-5 h-5" />
        </button>
      </div>

      {/* New Dashboard Button */}
      <div className="p-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
            theme === 'dark'
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
          } transition-colors text-sm font-medium`}
          title="Upload a new dataset"
        >
          <PlusIcon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Dataset</span>}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.parquet"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Conversations List */}
      <div className={`flex-1 overflow-y-auto p-2 space-y-1`}>
        {conversations.length === 0 ? (
          !collapsed && (
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} p-2 text-center`}>
              No conversations yet
            </p>
          )
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.conversationId}
              onClick={() => selectConversation(conv.conversationId)}
              className={`w-full text-left px-2 py-2 rounded text-sm transition-colors truncate ${
                currentConversationId === conv.conversationId
                  ? theme === 'dark'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-900'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:bg-dark-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={conv.fileName}
            >
              {!collapsed && <span>{conv.fileName}</span>}
            </button>
          ))
        )}
      </div>

    </div>
  );
}
