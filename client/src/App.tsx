import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer, useToasts } from './components/Toast';
import { useWebSocket } from './websocket/useWebSocket';
import { 
  Dashboard, 
  BotDetail,
  BotEditor,
  Tasks, 
  Keys, 
  Settings, 
  ImportExport,
  ModelPresets,
} from './pages';
import { LogHistory } from './pages/LogHistory';
import { LogSessionViewer } from './pages/LogSessionViewer';

function AppContent() {
  const { toasts, onClose } = useToasts();
  
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="bots/new" element={<BotEditor />} />
            <Route path="bots/:id" element={<BotDetail />} />
            <Route path="bots/:id/edit" element={<BotEditor />} />
            <Route path="logs" element={<LogHistory />} />
            <Route path="logs/bot/:botId" element={<LogHistory />} />
            <Route path="logs/session/:sessionId" element={<LogSessionViewer />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="keys" element={<Keys />} />
            <Route path="settings" element={<Settings />} />
            <Route path="model-presets" element={<ModelPresets />} />
            <Route path="import-export" element={<ImportExport />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer toasts={toasts} onClose={onClose} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
