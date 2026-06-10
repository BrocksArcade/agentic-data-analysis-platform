import { useState, useEffect, useRef } from 'react';
import { Message } from '../App';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';

interface ChatAreaProps {
  currentConversationId: string | null;
  messages: Message[];
  loading: boolean;
  uploadProgress: number;
  isFileLoaded: boolean;
  onSendMessage: (text: string) => void;
  onFileUpload: (file: File) => void;
}

export default function ChatArea({
  currentConversationId,
  messages,
  loading,
  uploadProgress,
  isFileLoaded,
  onSendMessage,
  onFileUpload,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-900">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4 text-white">Data Analysis</h1>
          <p className="text-dark-400 mb-8">
            Upload your CSV data and ask questions. I'll analyze it for you.
          </p>
          <p className="text-dark-500 text-sm mb-6">
            Just start typing — a conversation will be created automatically!
          </p>
          <div className="bg-dark-800 rounded-lg p-4 text-sm text-dark-300">
            <p>💡 Or click <span className="text-blue-400">"New Chat"</span> to start</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-dark-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex items-center justify-center">
            <p className="text-dark-500">No messages yet. Start by asking a question or uploading data.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-800 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-dark-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-dark-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-dark-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="px-6 py-3 bg-dark-800 border-t border-dark-700">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-dark-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-sm text-dark-400">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <InputArea
        disabled={loading}
        isFileLoaded={isFileLoaded}
        onSendMessage={onSendMessage}
        onFileUpload={onFileUpload}
      />
    </div>
  );
}
