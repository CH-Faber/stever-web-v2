import { LogEntry, LogLevel } from '../../../shared/types/index.js';
interface LogSession {
    sessionId: string;
    botId: string;
    botName: string;
    startTime: Date;
    endTime?: Date;
    logFile: string;
}
/**
 * 初始化日志存储服务
 */
export declare function initializeLogStorage(): Promise<void>;
/**
 * 开始新的日志会话
 */
export declare function startLogSession(botId: string, botName: string): Promise<string>;
/**
 * 结束日志会话
 */
export declare function endLogSession(botId: string): Promise<void>;
/**
 * 写入日志条目
 */
export declare function writeLogEntry(botId: string, log: LogEntry): Promise<void>;
/**
 * 读取会话日志
 */
export declare function readSessionLogs(sessionId: string, options?: {
    level?: LogLevel;
    limit?: number;
    offset?: number;
}): Promise<{
    logs: LogEntry[];
    total: number;
}>;
/**
 * 获取机器人的所有日志会话
 */
export declare function getBotSessions(botId: string): Promise<LogSession[]>;
/**
 * 获取所有日志会话
 */
export declare function getAllSessions(): Promise<LogSession[]>;
/**
 * 删除日志会话
 */
export declare function deleteSession(sessionId: string): Promise<void>;
/**
 * 获取活跃会话 ID
 */
export declare function getActiveSessionId(botId: string): string | undefined;
/**
 * 获取会话信息
 */
export declare function getSessionInfo(sessionId: string): LogSession | undefined;
export {};
