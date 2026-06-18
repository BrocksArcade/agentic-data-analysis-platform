import { ChevronIcon } from './icons';
import { MessageList } from './MessageList';
import InputArea from './InputArea';
import { useDashboard } from '../context/DashboardContext';

export function AIPanel() {
  const { aiPanelOpen, setAIPanelOpen, sendAIQuery, messages, loading, uploadProgress } = useDashboard();

  if (!aiPanelOpen) return null;

  return (
    <div className="w-80 border-l border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
        <button
          onClick={() => setAIPanelOpen(false)}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 transition"
        >
          <ChevronIcon dir="right" className="w-5 h-5" />
        </button>
      </div>
      <MessageList messages={messages} loading={loading} uploadProgress={uploadProgress} />
      <InputArea onSendMessage={sendAIQuery} compact />
    </div>
  );
}
