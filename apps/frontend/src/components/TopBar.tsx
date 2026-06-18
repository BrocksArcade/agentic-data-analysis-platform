import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { SparklesIcon } from './icons';
import { ModelSelector } from './ModelSelector';
import { useDashboard } from '../context/DashboardContext';

export function TopBar() {
  const { aiPanelOpen, setAIPanelOpen } = useDashboard();
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState('qwen2.5:7b-instruct-q2_K');

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Model Selector Button */}
          <button
            onClick={() => setModelSelectorOpen(true)}
            className="px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition text-sm font-medium"
            title="Switch AI model"
          >
            🤖 {currentModel.split(':')[0]}
          </button>

          <button
            onClick={() => setAIPanelOpen(!aiPanelOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition"
            title="Toggle AI panel"
          >
            <SparklesIcon />
          </button>
          <ThemeToggle />
        </div>
      </div>

      <ModelSelector
        isOpen={modelSelectorOpen}
        onClose={() => setModelSelectorOpen(false)}
        onModelChange={(model) => setCurrentModel(model)}
      />
    </>
  );
}
