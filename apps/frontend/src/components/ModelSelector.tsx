import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ModelProfile {
  name: string;
  size: string;
  speed: 'BLAZING' | 'FAST' | 'NORMAL' | 'SLOW';
  accuracy: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  description: string;
  vram: number;
}

interface ModelSelectorProps {
  onModelChange?: (model: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const speedColors = {
  BLAZING: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
  FAST: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  NORMAL: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
  SLOW: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
};

const accuracyStars = {
  LOW: '⭐',
  MEDIUM: '⭐⭐',
  HIGH: '⭐⭐⭐',
  VERY_HIGH: '⭐⭐⭐⭐',
};

export function ModelSelector({ onModelChange, isOpen, onClose }: ModelSelectorProps) {
  const { theme } = useTheme();
  const [models, setModels] = useState<ModelProfile[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchModels();
    }
  }, [isOpen]);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/models/stats');
      const data = await response.json();
      setModels(data.availableModels || []);
      setCurrentModel(data.currentModel || '');
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (modelName: string) => {
    try {
      const response = await fetch('/api/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName }),
      });

      if (response.ok) {
        setCurrentModel(modelName);
        onModelChange?.(modelName);
        setTimeout(onClose, 500);
      }
    } catch (err) {
      console.error('Failed to switch model:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 border-b ${theme === 'dark' ? 'border-dark-700' : 'border-gray-200'} px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600`}>
          <h2 className="text-xl font-bold text-white">Select AI Model</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading models...
              </p>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8">
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No models available. Make sure Ollama is running.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleSelectModel(model.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    currentModel === model.name
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : `border-gray-200 dark:border-dark-700 hover:border-indigo-400`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {model.name}
                    </h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${speedColors[model.speed]}`}>
                        {model.speed}
                      </span>
                      <span className="text-sm">{accuracyStars[model.accuracy]}</span>
                    </div>
                  </div>

                  <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {model.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>📦 {model.size}</span>
                    <span>💾 {model.vram}MB VRAM</span>
                    {currentModel === model.name && (
                      <span className="ml-auto bg-green-500 text-white px-2 py-1 rounded">
                        ✓ Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Select Buttons */}
          <div className={`border-t ${theme === 'dark' ? 'border-dark-700' : 'border-gray-200'} pt-4 mt-6`}>
            <p className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Quick Select:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const fastModel = models.find((m) => m.speed === 'BLAZING' || m.speed === 'FAST');
                  if (fastModel) handleSelectModel(fastModel.name);
                }}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium"
              >
                ⚡ Fast
              </button>
              <button
                onClick={() => {
                  const balancedModel = models.find((m) => m.speed === 'NORMAL');
                  if (balancedModel) handleSelectModel(balancedModel.name);
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium"
              >
                ⚖️ Balanced
              </button>
              <button
                onClick={() => {
                  const accurateModel = models.find((m) => m.accuracy === 'VERY_HIGH');
                  if (accurateModel) handleSelectModel(accurateModel.name);
                }}
                className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium"
              >
                🎯 Accurate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
