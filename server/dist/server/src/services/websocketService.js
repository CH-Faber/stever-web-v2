// Store the Socket.IO server instance
let io = null;
// Track subscriptions for debugging
const subscriptions = new Map(); // botId -> Set of socket IDs
/**
 * Initializes the WebSocket service with the Socket.IO server instance
 */
export function initializeWebSocket(server) {
    io = server;
    setupConnectionHandlers();
}
/**
 * Sets up connection and event handlers for Socket.IO
 */
function setupConnectionHandlers() {
    if (!io)
        return;
    io.on('connection', (socket) => {
        console.log(`[WebSocket] Client connected: ${socket.id}`);
        // Handle subscribe event
        socket.on('subscribe', (botId) => {
            handleSubscribe(socket, botId);
        });
        // Handle unsubscribe event
        socket.on('unsubscribe', (botId) => {
            handleUnsubscribe(socket, botId);
        });
        // Handle disconnect
        socket.on('disconnect', () => {
            handleDisconnect(socket);
        });
    });
}
/**
 * Handles client subscription to a bot's events
 */
function handleSubscribe(socket, botId) {
    const room = `bot:${botId}`;
    socket.join(room);
    // Track subscription
    if (!subscriptions.has(botId)) {
        subscriptions.set(botId, new Set());
    }
    subscriptions.get(botId).add(socket.id);
    console.log(`[WebSocket] Client ${socket.id} subscribed to bot:${botId}`);
}
/**
 * Handles client unsubscription from a bot's events
 */
function handleUnsubscribe(socket, botId) {
    const room = `bot:${botId}`;
    socket.leave(room);
    // Remove from tracking
    const botSubs = subscriptions.get(botId);
    if (botSubs) {
        botSubs.delete(socket.id);
        if (botSubs.size === 0) {
            subscriptions.delete(botId);
        }
    }
    console.log(`[WebSocket] Client ${socket.id} unsubscribed from bot:${botId}`);
}
/**
 * Handles client disconnect - cleans up all subscriptions
 */
function handleDisconnect(socket) {
    // Remove socket from all subscription tracking
    subscriptions.forEach((sockets, botId) => {
        if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                subscriptions.delete(botId);
            }
        }
    });
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
}
/**
 * Broadcasts a bot status update to all subscribed clients
 */
export function broadcastBotStatus(botId, status) {
    if (!io) {
        console.warn('[WebSocket] Server not initialized, cannot broadcast status');
        return;
    }
    const event = { botId, status };
    io.to(`bot:${botId}`).emit('bot:status', event);
    console.log(`[WebSocket] Broadcast status for bot:${botId} - ${status.status}`);
}
/**
 * Broadcasts a log entry to all subscribed clients
 */
export function broadcastBotLog(botId, log) {
    if (!io) {
        console.warn('[WebSocket] Server not initialized, cannot broadcast log');
        return;
    }
    const event = { botId, log };
    io.to(`bot:${botId}`).emit('bot:log', event);
}
/**
 * Broadcasts a position update to all subscribed clients
 */
export function broadcastBotPosition(botId, position) {
    if (!io) {
        console.warn('[WebSocket] Server not initialized, cannot broadcast position');
        return;
    }
    const event = { botId, position };
    io.to(`bot:${botId}`).emit('bot:position', event);
}
/**
 * Broadcasts an inventory update to all subscribed clients
 */
export function broadcastBotInventory(botId, inventory) {
    if (!io) {
        console.warn('[WebSocket] Server not initialized, cannot broadcast inventory');
        return;
    }
    const event = { botId, inventory };
    io.to(`bot:${botId}`).emit('bot:inventory', event);
}
/**
 * Broadcasts an error to all subscribed clients
 */
export function broadcastBotError(botId, error) {
    if (!io) {
        console.warn('[WebSocket] Server not initialized, cannot broadcast error');
        return;
    }
    const event = { botId, error };
    io.to(`bot:${botId}`).emit('bot:error', event);
}
/**
 * Gets the number of clients subscribed to a specific bot
 */
export function getSubscriberCount(botId) {
    return subscriptions.get(botId)?.size ?? 0;
}
/**
 * Gets all bot IDs that have active subscribers
 */
export function getActiveSubscriptions() {
    return Array.from(subscriptions.keys());
}
/**
 * Gets the Socket.IO server instance
 */
export function getIO() {
    return io;
}
