import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { getSessionLogs, getActiveSession } from '../api/logs';
import { LogViewer } from '../components/monitor/LogViewer';
import type { LogEntry, LogSession } from '../../../shared/types';

export function LogSessionViewer() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [session, setSession] = useState<LogSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionLogs();
    }
  }, [sessionId]);

  async function loadSessionLogs() {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load logs
      const { logs: sessionLogs } = await getSessionLogs(sessionId);
      setLogs(sessionLogs);

      // Try to get session info
      // Extract botId from sessionId (format: botId_timestamp)
      const botId = sessionId.split('_')[0];
      if (botId) {
        const activeSession = await getActiveSession(botId);
        if (activeSession.session && activeSession.session.sessionId === sessionId) {
          setSession(activeSession.session);
        }
      }
    } catch (err) {
      console.error('Failed to load session logs:', err);
      setError('加载日志失败');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!sessionId || logs.length === 0) return;

    const content = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionId}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-lg py-lg h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate(-1)}
            className="p-sm hover:bg-background-secondary rounded-md transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              日志会话
            </h1>
            {session && (
              <p className="text-sm text-text-muted mt-xs">
                {session.botName} - {session.startTime.toLocaleString('zh-CN')}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={logs.length === 0}
          className="flex items-center gap-xs px-md py-sm bg-background-secondary border border-border rounded-md hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} strokeWidth={1.5} />
          <span>下载日志</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error px-md py-sm rounded-md mb-md">
          {error}
        </div>
      )}

      {/* Log Viewer */}
      <div className="flex-1 bg-background-secondary border border-border rounded-lg overflow-hidden">
        <LogViewer logs={logs} maxHeight="100%" />
      </div>
    </div>
  );
}
