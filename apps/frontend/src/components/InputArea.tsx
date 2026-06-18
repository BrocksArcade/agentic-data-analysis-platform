import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  onFileUpload?: (file: File) => void;
  disabled?: boolean;
  isFileLoaded?: boolean;
  compact?: boolean;
}

export default function InputArea({
  onSendMessage,
  onFileUpload,
  disabled = false,
  isFileLoaded = true,
  compact = false,
}: InputAreaProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const bgClass = compact ? 'bg-white dark:bg-dark-800' : theme === 'dark' ? 'bg-dark-800' : 'bg-gray-50';
  const borderClass = theme === 'dark' ? 'border-dark-700' : 'border-gray-200';
  const inputBgClass = theme === 'dark'
    ? 'bg-dark-700 text-white placeholder-dark-500'
    : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300';
  const buttonClass = theme === 'dark'
    ? 'bg-dark-700 hover:bg-dark-600 text-gray-400'
    : 'bg-gray-200 hover:bg-gray-300 text-gray-600';

  return (
    <div className={`border-t ${borderClass} ${bgClass} ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex gap-2">
        {/* File Upload Button - only show if not compact */}
        {!compact && onFileUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={`flex-shrink-0 p-2 rounded-lg ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            title="Upload CSV file"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}

        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || !isFileLoaded}
          placeholder={isFileLoaded ? 'Ask a question...' : 'Upload a file first...'}
          className={`flex-1 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${inputBgClass}`}
          rows={1}
          style={{ minHeight: '36px', maxHeight: '100px' }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !isFileLoaded || !input.trim()}
          className="flex-shrink-0 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16151496 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.99021575 L3.03521743,10.4311088 C3.03521743,10.5881939 3.19218622,10.7452913 3.50612381,10.7452913 L16.6915026,11.5308784 C16.6915026,11.5308784 17.1624089,11.5308784 17.1624089,12.0022144 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
          </svg>
        </button>
      </div>

      {/* Hidden file input */}
      {onFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.parquet"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
}
