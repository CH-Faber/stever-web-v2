import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import * as logStorage from '../logStorageService';
const TEST_LOGS_DIR = path.join(process.cwd(), 'logs-test');
describe('LogStorageService', () => {
    beforeEach(async () => {
        // 使用测试目录
        process.env.LOGS_DIR = TEST_LOGS_DIR;
        await logStorage.initializeLogStorage();
    });
    afterEach(async () => {
        // 清理测试目录
        try {
            await fs.rm(TEST_LOGS_DIR, { recursive: true, force: true });
        }
        catch (err) {
            // 忽略错误
        }
    });
    it('should create a new log session', async () => {
        const sessionId = await logStorage.startLogSession('bot_123', 'Test Bot');
        expect(sessionId).toContain('bot_123');
        const session = logStorage.getSessionInfo(sessionId);
        expect(session).toBeDefined();
        expect(session?.botId).toBe('bot_123');
        expect(session?.botName).toBe('Test Bot');
    });
    it('should write log entries to file', async () => {
        const sessionId = await logStorage.startLogSession('bot_123', 'Test Bot');
        const log = {
            timestamp: new Date(),
            level: 'info',
            message: 'Test message',
            source: 'test',
        };
        await logStorage.writeLogEntry('bot_123', log);
        // 读取日志
        const { logs } = await logStorage.readSessionLogs(sessionId);
        expect(logs.length).toBe(1);
        expect(logs[0].message).toBe('Test message');
    });
    it('should end a log session', async () => {
        const sessionId = await logStorage.startLogSession('bot_123', 'Test Bot');
        await logStorage.endLogSession('bot_123');
        const session = logStorage.getSessionInfo(sessionId);
        expect(session?.endTime).toBeDefined();
    });
    it('should filter logs by level', async () => {
        const sessionId = await logStorage.startLogSession('bot_123', 'Test Bot');
        await logStorage.writeLogEntry('bot_123', {
            timestamp: new Date(),
            level: 'info',
            message: 'Info message',
            source: 'test',
        });
        await logStorage.writeLogEntry('bot_123', {
            timestamp: new Date(),
            level: 'error',
            message: 'Error message',
            source: 'test',
        });
        const { logs: errorLogs } = await logStorage.readSessionLogs(sessionId, {
            level: 'error',
        });
        expect(errorLogs.length).toBe(1);
        expect(errorLogs[0].level).toBe('error');
    });
    it('should get bot sessions', async () => {
        await logStorage.startLogSession('bot_123', 'Test Bot 1');
        await logStorage.startLogSession('bot_123', 'Test Bot 1');
        await logStorage.startLogSession('bot_456', 'Test Bot 2');
        const sessions = await logStorage.getBotSessions('bot_123');
        expect(sessions.length).toBe(2);
        expect(sessions[0].botId).toBe('bot_123');
    });
    it('should delete a session', async () => {
        const sessionId = await logStorage.startLogSession('bot_123', 'Test Bot');
        await logStorage.deleteSession(sessionId);
        const session = logStorage.getSessionInfo(sessionId);
        expect(session).toBeUndefined();
    });
});
