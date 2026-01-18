import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Trash2 } from 'lucide-react';
import { getAllSessions, getBotSessions, deleteSession } from '../api/logs';
import type { LogSession } from '../../../shared/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function LogHistory() {
  const { botId } = useParams<{ botId?: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LogSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [botId]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const data = botId ? await getBotSessions(botId) : await getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('加载日志会话失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('确定要删除这个日志会话吗？此操作无法撤销。')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('删除失败');
    }
  }

  function handleViewSession(sessionId: string) {
    navigate(`/logs/session/${sessionId}`);
  }

  function formatDuration(start: Date, end?: Date) {
    const endTime = end || new Date();
    const durationMs = endTime.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-lg py-lg">
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
              {botId ? '机器人日志历史' : '所有日志历史'}
            </h1>
            <p className="text-sm text-text-muted mt-xs">
              查看和管理历史日志会话
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error text-status-error px-md py-sm rounded-md mb-md">
          {error}
        </div>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-xl text-text-muted">
          <Calendar size={48} strokeWidth={1.5} className="mx-auto mb-md opacity-50" />
          <p>暂无日志会话</p>
        </div>
      ) : (
        <div className="grid gap-md">
          {sessions.map(session => (
            <div
              key={session.sessionId}
              className="bg-background-secondary border border-border rounded-lg p-md hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-sm mb-xs">
                    <h3 className="text-lg font-medium text-text-primary">
                      {session.botName}
                    </h3>
                    {!session.endTime && (
                      <span className="px-sm py-xs text-xs bg-status-success/20 text-status-success rounded-full">
                        运行中
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-md text-sm text-text-muted">
                    <div className="flex items-center gap-xs">
                      <Calendar size={14} strokeWidth={1.5} />
                      <span>
                        {session.startTime.toLocaleString('zh-CN')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-xs">
                      <Clock size={14} strokeWidth={1.5} />
                      <span>
                        {formatDuration(session.startTime, session.endTime)}
                      </span>
                    </div>
                    
                    <div className="text-text-muted">
                      {formatDistanceToNow(session.startTime, { 
                        addSuffix: true,
                        locale: zhCN 
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => handleViewSession(session.sessionId)}
                    className="px-md py-sm bg-accent text-white rounded-md hover:bg-accent-dark transition-colors text-sm"
                  >
                    查看日志
                  </button>
                  
                  <button
                    onClick={() => handleDelete(session.sessionId)}
                    className="p-sm text-text-muted hover:text-status-error hover:bg-status-error/10 rounded-md transition-colors"
                    title="删除会话"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
