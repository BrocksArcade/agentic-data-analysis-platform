import { Conversation } from '../App';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
}: SidebarProps) {
  return (
    <div className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${
              currentConversationId === conv.id
                ? 'bg-dark-700 text-white'
                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
            }`}
            title={conv.name}
          >
            {conv.name}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-dark-700 p-4 space-y-2">
        <button className="w-full px-4 py-2 text-dark-300 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors">
          Settings
        </button>
        <button className="w-full px-4 py-2 text-dark-300 hover:text-white text-sm rounded-lg hover:bg-dark-700 transition-colors">
          Help
        </button>
      </div>
    </div>
  );
}
