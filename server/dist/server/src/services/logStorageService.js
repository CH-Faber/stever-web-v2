import { promises as fs } from 'fs';
import path from 'path';
// 日志存储目录 - 使用项目根目录而不是 server 目录
const PROJECT_ROOT = path.join(process.cwd(), '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
// 活跃的日志会话（botId -> sessionId）
const activeSessions = new Map();
// 会话元数据缓存
const sessionMetadata = new Map();
/**
 * 初始化日志存储服务
 */
export async function initializeLogStorage() {
    try {
        await fs.access(LOGS_DIR);
    }
    catch {
        await fs.mkdir(LOGS_DIR, { recursive: true });
        console.log(`[LogStorage] Created logs directory: ${LOGS_DIR}`);
    }
    // 加载现有会话元数据
    await loadSessionMetadata();
}
/**
 * 开始新的日志会话
 */
export async function startLogSession(botId, botName) {
    // 如果已有活跃会话，先结束它
    if (activeSessions.has(botId)) {
        await endLogSession(botId);
    }
    const sessionId = generateSessionId(botId);
    const startTime = new Date();
    const logFile = path.join(LOGS_DIR, `${sessionId}.jsonl`);
    const session = {
        sessionId,
        botId,
        botName,
        startTime,
        logFile,
    };
    activeSessions.set(botId, sessionId);
    sessionMetadata.set(sessionId, session);
    // 创建日志文件并写入会话头
    const header = {
        type: 'session_start',
        sessionId,
        botId,
        botName,
        startTime: startTime.toISOString(),
    };
    await fs.writeFile(logFile, JSON.stringify(header) + '\n', 'utf-8');
    // 保存会话元数据
    await saveSessionMetadata();
    console.log(`[LogStorage] Started log session ${sessionId} for bot ${botId}`);
    return sessionId;
}
/**
 * 结束日志会话
 */
export async function endLogSession(botId) {
    const sessionId = activeSessions.get(botId);
    if (!sessionId) {
        return;
    }
    const session = sessionMetadata.get(sessionId);
    if (!session) {
        return;
    }
    session.endTime = new Date();
    activeSessions.delete(botId);
    // 写入会话结束标记
    const footer = {
        type: 'session_end',
        sessionId,
        endTime: session.endTime.toISOString(),
    };
    try {
        await fs.appendFile(session.logFile, JSON.stringify(footer) + '\n', 'utf-8');
    }
    catch (err) {
        console.error(`[LogStorage] Error writing session end: ${err}`);
    }
    // 保存会话元数据
    await saveSessionMetadata();
    console.log(`[LogStorage] Ended log session ${sessionId} for bot ${botId}`);
}
/**
 * 写入日志条目
 */
export async function writeLogEntry(botId, log) {
    const sessionId = activeSessions.get(botId);
    if (!sessionId) {
        console.warn(`[LogStorage] No active session for bot ${botId}`);
        return;
    }
    const session = sessionMetadata.get(sessionId);
    if (!session) {
        console.warn(`[LogStorage] Session metadata not found: ${sessionId}`);
        return;
    }
    // 将日志条目序列化为 JSON Lines 格式
    const logLine = {
        type: 'log',
        timestamp: log.timestamp.toISOString(),
        level: log.level,
        message: log.message,
        source: log.source,
    };
    try {
        await fs.appendFile(session.logFile, JSON.stringify(logLine) + '\n', 'utf-8');
    }
    catch (err) {
        console.error(`[LogStorage] Error writing log entry: ${err}`);
    }
}
/**
 * 读取会话日志
 */
export async function readSessionLogs(sessionId, options) {
    const session = sessionMetadata.get(sessionId);
    if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
    }
    try {
        const content = await fs.readFile(session.logFile, 'utf-8');
        const lines = content.trim().split('\n');
        const logs = [];
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                // 只处理日志类型的条目
                if (entry.type !== 'log')
                    continue;
                // 过滤日志级别
                if (options?.level && entry.level !== options.level)
                    continue;
                logs.push({
                    timestamp: new Date(entry.timestamp),
                    level: entry.level,
                    message: entry.message,
                    source: entry.source,
                });
            }
            catch (err) {
                console.error(`[LogStorage] Error parsing log line: ${err}`);
            }
        }
        const total = logs.length;
        // 应用分页
        const offset = options?.offset || 0;
        const limit = options?.limit || total;
        const paginatedLogs = logs.slice(offset, offset + limit);
        return { logs: paginatedLogs, total };
    }
    catch (err) {
        console.error(`[LogStorage] Error reading session logs: ${err}`);
        throw err;
    }
}
/**
 * 获取机器人的所有日志会话
 */
export async function getBotSessions(botId) {
    const sessions = [];
    for (const session of sessionMetadata.values()) {
        if (session.botId === botId) {
            sessions.push(session);
        }
    }
    // 按开始时间倒序排序
    sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return sessions;
}
/**
 * 获取所有日志会话
 */
export async function getAllSessions() {
    const sessions = Array.from(sessionMetadata.values());
    // 按开始时间倒序排序
    sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return sessions;
}
/**
 * 删除日志会话
 */
export async function deleteSession(sessionId) {
    const session = sessionMetadata.get(sessionId);
    if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
    }
    // 删除日志文件
    try {
        await fs.unlink(session.logFile);
    }
    catch (err) {
        console.error(`[LogStorage] Error deleting log file: ${err}`);
    }
    // 从元数据中移除
    sessionMetadata.delete(sessionId);
    // 如果是活跃会话，也要移除
    if (activeSessions.get(session.botId) === sessionId) {
        activeSessions.delete(session.botId);
    }
    // 保存元数据
    await saveSessionMetadata();
    console.log(`[LogStorage] Deleted session ${sessionId}`);
}
/**
 * 生成会话 ID
 */
function generateSessionId(botId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${botId}_${timestamp}`;
}
/**
 * 保存会话元数据到文件
 */
async function saveSessionMetadata() {
    const metadataFile = path.join(LOGS_DIR, 'sessions.json');
    const sessions = Array.from(sessionMetadata.values()).map(session => ({
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
    }));
    try {
        await fs.writeFile(metadataFile, JSON.stringify(sessions, null, 2), 'utf-8');
    }
    catch (err) {
        console.error(`[LogStorage] Error saving session metadata: ${err}`);
    }
}
/**
 * 从文件加载会话元数据
 */
async function loadSessionMetadata() {
    const metadataFile = path.join(LOGS_DIR, 'sessions.json');
    try {
        const content = await fs.readFile(metadataFile, 'utf-8');
        const sessions = JSON.parse(content);
        for (const session of sessions) {
            sessionMetadata.set(session.sessionId, {
                ...session,
                startTime: new Date(session.startTime),
                endTime: session.endTime ? new Date(session.endTime) : undefined,
            });
        }
        console.log(`[LogStorage] Loaded ${sessions.length} session(s) from metadata`);
    }
    catch (err) {
        // 文件不存在或解析失败，忽略
        console.log('[LogStorage] No existing session metadata found');
    }
}
/**
 * 获取活跃会话 ID
 */
export function getActiveSessionId(botId) {
    return activeSessions.get(botId);
}
/**
 * 获取会话信息
 */
export function getSessionInfo(sessionId) {
    return sessionMetadata.get(sessionId);
}
