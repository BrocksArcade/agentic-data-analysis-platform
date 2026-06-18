import Sidebar from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { AIPanel } from './components/AIPanel';
import './index.css';

function App() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Dashboard />
          <AIPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
