import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { socketService } from '../services/socket';
import { ColumnSchema, Widget, ConversationSummary, WidgetSpec, ChartContract } from '../types/dashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DashboardContextType {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  schema: ColumnSchema[];
  widgets: Widget[];
  messages: Message[];
  loading: boolean;
  uploadProgress: number;
  focusWidgetId: string | null;
  selectConversation: (id: string) => void;
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  buildWidget: (spec: WidgetSpec) => void;
  sendAIQuery: (question: string) => void;
  handleFileUpload: (file: File) => void;
  setAIPanelOpen: (open: boolean) => void;
  aiPanelOpen: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const CHUNK_SIZE = 64 * 1024;
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [schema, setSchema] = useState<ColumnSchema[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [focusWidgetId, setFocusWidgetId] = useState<string | null>(null);
  const [aiPanelOpen, setAIPanelOpen] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const addWidget = useCallback((widget: Widget) => {
    setWidgets((prev) => [...prev, widget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setMessages([]);
    setWidgets([]);
    setSchema([]);

    const socket = socketService.getSocket();
    socket.emit('conversation:open', { conversationId: id, userId: 'default-user' });
  }, []);

  const buildWidget = useCallback((spec: WidgetSpec) => {
    if (!currentConversationId) return;

    const socket = socketService.getSocket();
    socket.emit('widget:build', { conversationId: currentConversationId, spec });
  }, [currentConversationId]);

  const sendAIQuery = useCallback((question: string) => {
    if (!currentConversationId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setLoading(true);

    const socket = socketService.getSocket();
    socket.emit('agent:query', {
      conversationId: currentConversationId,
      userId: 'default-user',
      question,
    });
  }, [currentConversationId, addMessage]);

  const handleFileUpload = useCallback((file: File) => {
    let convId = currentConversationId || uuidv4();
    setCurrentConversationId(convId);
    setMessages([]);
    setWidgets([]);

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
  }, [currentConversationId]);

  useEffect(() => {
    const socket = socketService.connect();

    socket.emit('conversations:list', { userId: 'default-user' });

    socket.on('conversations:listed', (data) => {
      setConversations(data.conversations || []);
    });

    socket.on('upload:progress', (data) => {
      setUploadProgress(Math.round(data.percent));
    });

    socket.on('upload:ready', (data: any) => {
      setUploadProgress(0);
      setCurrentConversationId(data.conversationId);
      setSchema(data.schema || []);
      setMessages([]);
      setWidgets([]);
      socket.emit('conversations:list', { userId: 'default-user' });
    });

    socket.on('upload:error', (error) => {
      console.error('Upload error:', error);
      setUploadProgress(0);
    });

    socket.on('conversation:loaded', (data: any) => {
      setSchema(data.schema || []);
      setMessages([]);
    });

    socket.on('charts:listed', (data: any) => {
      const all = data.charts || [];
      // Self-heal: prune any chart saved without a renderable contract
      // (e.g. from failed AI runs) so it can't blank the dashboard.
      all
        .filter((c: any) => !c?.contract?.chartType)
        .forEach((c: any) => socket.emit('chart:delete', { chartId: c.chartId }));

      const chartWidgets = all
        .filter((c: any) => c?.contract?.chartType)
        .map((c: any) => ({
          id: c.chartId,
          chartType: c.chartType,
          title: c.title,
          spec: c.config,
          chart: c.contract,
          source: c.source,
        }));
      setWidgets(chartWidgets);
    });

    socket.on('widget:built', (data: any) => {
      const localId = uuidv4();
      const widget: Widget = {
        id: localId,
        chartType: data.spec.chartType,
        title: data.chart?.title || data.spec.chartType,
        spec: data.spec,
        chart: data.chart,
        source: 'manual',
      };
      addWidget(widget);

      if (currentConversationId) {
        socket.emit('chart:save', {
          conversationId: currentConversationId,
          userId: 'default-user',
          chart: { chartType: widget.chartType, title: widget.title, source: widget.source, config: widget.spec, contract: widget.chart },
        });
      }
    });

    socket.on('widget:error', (data) => {
      console.error('Widget error:', data.message);
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Widget error: ${data.message}`,
        timestamp: new Date(),
      });
    });

    socket.on('chart:saved', (data) => {
      console.log(`Chart saved with ID: ${data.chartId}`);
    });

    socket.on('chart:deleted', (data) => {
      removeWidget(data.chartId);
    });

    socket.on('agent:thinking', (data) => {
      console.log('Agent thinking:', data);
    });

    socket.on('agent:result', (data: ChartContract) => {
      if (data?.chartType && !['text', 'error'].includes(data.chartType)) {
        const localId = uuidv4();
        const widget: Widget = {
          id: localId,
          chartType: data.chartType,
          title: data.title,
          spec: null,
          chart: data,
          source: 'ai',
        };
        addWidget(widget);
        setFocusWidgetId(localId);

        if (currentConversationId) {
          socket.emit('chart:save', {
            conversationId: currentConversationId,
            userId: 'default-user',
            chart: { chartType: widget.chartType, title: widget.title, source: widget.source, config: widget.spec, contract: widget.chart },
          });
        }
      } else {
        const content = data?.summary || JSON.stringify(data);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        });
      }
      setLoading(false);
    });

    socket.on('agent:error', (error) => {
      addMessage({
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      });
      setLoading(false);
    });

    return () => {
      socket.off('conversations:listed');
      socket.off('upload:progress');
      socket.off('upload:ready');
      socket.off('upload:error');
      socket.off('conversation:loaded');
      socket.off('charts:listed');
      socket.off('widget:built');
      socket.off('widget:error');
      socket.off('chart:saved');
      socket.off('chart:deleted');
      socket.off('agent:thinking');
      socket.off('agent:result');
      socket.off('agent:error');
    };
  }, [currentConversationId, addMessage, addWidget, removeWidget]);

  return (
    <DashboardContext.Provider
      value={{
        conversations,
        currentConversationId,
        schema,
        widgets,
        messages,
        loading,
        uploadProgress,
        focusWidgetId,
        selectConversation,
        addWidget,
        removeWidget,
        buildWidget,
        sendAIQuery,
        handleFileUpload,
        setAIPanelOpen,
        aiPanelOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
