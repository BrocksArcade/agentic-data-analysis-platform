import { useState, useEffect } from 'react';
import { socketService } from './services/socket';

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import './index.css';

export interface Conversation {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHUNK_SIZE = 64 * 1024; // 64KB

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadedConversations, setLoadedConversations] = useState<Set<string>>(new Set());

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('upload:progress', (data) => {
      setUploadProgress(Math.round(data.percent));
    });

    socket.on('upload:ready', (data: { conversationId: string; tableName: string }) => {
      console.log('Upload complete:', data);
      setUploadProgress(0);
      setLoadedConversations((prev) => new Set(prev).add(data.conversationId));
    });

    socket.on('upload:error', (error) => {
      console.error('Upload error:', error);
      setUploadProgress(0);
    });

    socket.on('agent:thinking', (data) => {
      console.log('Agent thinking:', data);
    });

    socket.on('agent:result', (data) => {
      console.log('Agent result:', data);
      const content = data?.chartType === 'text' || data?.chartType === 'error'
        ? (data.summary || JSON.stringify(data))
        : JSON.stringify(data);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      });
      setLoading(false);
    });

    socket.on('agent:error', (error) => {
      console.error('Agent error:', error);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      });
      setLoading(false);
    });

    return () => {
      socket.off('upload:progress');
      socket.off('upload:ready');
      socket.off('upload:error');
      socket.off('agent:thinking');
      socket.off('agent:result');
      socket.off('agent:error');
    };
  }, []);

  const createNewConversation = () => {
    const id = uuidv4();
    const newConv: Conversation = {
      id,
      name: `Conversation ${conversations.length + 1}`,
      createdAt: new Date(),
    };
    setConversations([newConv, ...conversations]);
    setCurrentConversationId(id);
    setMessages([]);
    return id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setMessages([]);
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setLoading(true);

    const socket = socketService.getSocket();
    socket.emit('agent:query', {
      conversationId: convId,
      userId: 'default-user',
      question: text,
    });
  };

  const handleFileUpload = (file: File) => {
    let convId = currentConversationId;
    if (!convId) {
      convId = createNewConversation();
    }

    // Update conversation name to match the file
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, name: file.name } : c)),
    );

    const socket = socketService.getSocket();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    socket.emit('upload:start', {
      conversationId: convId,
      userId: 'default-user',
      fileName: file.name,
      totalChunks,
      fileSize: file.size,
    });

    let chunkIndex = 0;

    const sendNextChunk = () => {
      if (chunkIndex >= totalChunks) {
        socket.emit('upload:complete', {
          conversationId: convId,
          userId: 'default-user',
          fileName: file.name,
        });
        return;
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const blob = file.slice(start, end);
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          socket.emit('upload:chunk', {
            conversationId: convId,
            data: e.target.result,
          });
          chunkIndex++;
          sendNextChunk();
        }
      };

      reader.readAsArrayBuffer(blob);
    };

    sendNextChunk();
  };

  const isCurrentConvLoaded = currentConversationId
    ? loadedConversations.has(currentConversationId)
    : false;

  return (
    <div className="flex h-screen bg-dark-900">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={createNewConversation}
        onSelectConversation={selectConversation}
      />
      <ChatArea
        currentConversationId={currentConversationId}
        messages={messages}
        loading={loading}
        uploadProgress={uploadProgress}
        isFileLoaded={isCurrentConvLoaded}
        onSendMessage={sendMessage}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}

export default App;
