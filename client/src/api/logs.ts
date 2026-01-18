import { api } from './client';
import type { 
  LogSession, 
  LogSessionsResponse, 
  SessionLogsResponse,
  ActiveSessionResponse,
  LogLevel 
} from '../../../shared/types';

/**
 * 获取所有日志会话
 */
export async function getAllSessions(): Promise<LogSession[]> {
  const response = await api.get<LogSessionsResponse>('/api/logs/sessions');
  return response.sessions.map(session => ({
    ...session,
    startTime: new Date(session.startTime),
    endTime: session.endTime ? new Date(session.endTime) : undefined,
  }));
}

/**
 * 获取指定机器人的所有日志会话
 */
export async function getBotSessions(botId: string): Promise<LogSession[]> {
  const response = await api.get<LogSessionsResponse>(
    `/api/logs/sessions/bot/${botId}`
  );
  return response.sessions.map(session => ({
    ...session,
    startTime: new Date(session.startTime),
    endTime: session.endTime ? new Date(session.endTime) : undefined,
  }));
}

/**
 * 获取指定会话的日志
 */
export async function getSessionLogs(
  sessionId: string,
  options?: {
    level?: LogLevel;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: any[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.level) params.append('level', options.level);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const queryString = params.toString();
  const endpoint = queryString 
    ? `/api/logs/sessions/${sessionId}?${queryString}`
    : `/api/logs/sessions/${sessionId}`;

  const response = await api.get<SessionLogsResponse>(endpoint);
  
  return {
    logs: response.logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
    })),
    total: response.total,
  };
}

/**
 * 删除日志会话
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/api/logs/sessions/${sessionId}`);
}

/**
 * 获取机器人当前活跃的会话
 */
export async function getActiveSession(botId: string): Promise<ActiveSessionResponse> {
  const response = await api.get<ActiveSessionResponse>(
    `/api/logs/active/${botId}`
  );
  
  if (response.session) {
    return {
      ...response,
      session: {
        ...response.session,
        startTime: new Date(response.session.startTime),
        endTime: response.session.endTime 
          ? new Date(response.session.endTime) 
          : undefined,
      },
    };
  }
  
  return response;
}
