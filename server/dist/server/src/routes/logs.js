import { Router } from 'express';
import * as logStorage from '../services/logStorageService.js';
const router = Router();
/**
 * GET /api/logs/sessions
 * 获取所有日志会话
 */
router.get('/sessions', async (_req, res) => {
    try {
        const sessions = await logStorage.getAllSessions();
        res.json({ sessions });
    }
    catch (err) {
        console.error('[API] Error fetching sessions:', err);
        res.status(500).json({
            error: {
                code: 'FETCH_SESSIONS_ERROR',
                message: 'Failed to fetch log sessions',
            },
        });
    }
});
/**
 * GET /api/logs/sessions/bot/:botId
 * 获取指定机器人的所有日志会话
 */
router.get('/sessions/bot/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const sessions = await logStorage.getBotSessions(botId);
        res.json({ sessions });
    }
    catch (err) {
        console.error('[API] Error fetching bot sessions:', err);
        res.status(500).json({
            error: {
                code: 'FETCH_BOT_SESSIONS_ERROR',
                message: 'Failed to fetch bot log sessions',
            },
        });
    }
});
/**
 * GET /api/logs/sessions/:sessionId
 * 获取指定会话的日志
 */
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { level, limit, offset } = req.query;
        const options = {};
        if (level && ['info', 'warn', 'error'].includes(level)) {
            options.level = level;
        }
        if (limit) {
            options.limit = parseInt(limit, 10);
        }
        if (offset) {
            options.offset = parseInt(offset, 10);
        }
        const result = await logStorage.readSessionLogs(sessionId, options);
        res.json(result);
    }
    catch (err) {
        console.error('[API] Error fetching session logs:', err);
        res.status(500).json({
            error: {
                code: 'FETCH_SESSION_LOGS_ERROR',
                message: 'Failed to fetch session logs',
            },
        });
    }
});
/**
 * DELETE /api/logs/sessions/:sessionId
 * 删除指定的日志会话
 */
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await logStorage.deleteSession(sessionId);
        res.json({ success: true });
    }
    catch (err) {
        console.error('[API] Error deleting session:', err);
        res.status(500).json({
            error: {
                code: 'DELETE_SESSION_ERROR',
                message: 'Failed to delete log session',
            },
        });
    }
});
/**
 * GET /api/logs/active/:botId
 * 获取机器人当前活跃的会话ID
 */
router.get('/active/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const sessionId = logStorage.getActiveSessionId(botId);
        if (!sessionId) {
            res.json({ active: false });
            return;
        }
        const session = logStorage.getSessionInfo(sessionId);
        res.json({ active: true, sessionId, session });
    }
    catch (err) {
        console.error('[API] Error fetching active session:', err);
        res.status(500).json({
            error: {
                code: 'FETCH_ACTIVE_SESSION_ERROR',
                message: 'Failed to fetch active session',
            },
        });
    }
});
export default router;
