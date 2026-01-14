import { Server, Socket } from 'socket.io';
import {
  BotStatus,
  LogEntry,
  Position,
  InventoryItem,
  BotStatusEvent,
  BotLogEvent,
  BotPositionEvent,
  BotInventoryEvent,
  BotErrorEvent,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../../../shared/types/index.js';

// Type-safe Socket.IO server
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Store the Socket.IO server instance
let io: TypedServer | null = null;

// Track subscriptions for debugging
const subscriptions: Map<string, Set<string>> = new Map(); // botId -> Set of socket IDs

/**
 * Initializes the WebSocket service with the Socket.IO server instance
 */
export function initializeWebSocket(server: TypedServer): void {
  io = server;
  setupConnectionHandlers();
}

/**
 * Sets up connection and event handlers for Socket.IO
 */
function setupConnectionHandlers(): void {
  if (!io) return;

  io.on('connection', (socket: TypedSocket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle subscribe event
    socket.on('subscribe', (botId: string) => {
      handleSubscribe(socket, botId);
    });

    // Handle unsubscribe event
    socket.on('unsubscribe', (botId: string) => {
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
function handleSubscribe(socket: TypedSocket, botId: string): void {
  const room = `bot:${botId}`;
  socket.join(room);

  // Track subscription
  if (!subscriptions.has(botId)) {
    subscriptions.set(botId, new Set());
  }
  subscriptions.get(botId)!.add(socket.id);

  console.log(`[WebSocket] Client ${socket.id} subscribed to bot:${botId}`);
}

/**
 * Handles client unsubscription from a bot's events
 */
function handleUnsubscribe(socket: TypedSocket, botId: string): void {
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
function handleDisconnect(socket: TypedSocket): void {
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
export function broadcastBotStatus(botId: string, status: BotStatus): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast status');
    return;
  }

  const event: BotStatusEvent = { botId, status };
  io.to(`bot:${botId}`).emit('bot:status', event);
  
  console.log(`[WebSocket] Broadcast status for bot:${botId} - ${status.status}`);
}

/**
 * Broadcasts a log entry to all subscribed clients
 */
export function broadcastBotLog(botId: string, log: LogEntry): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast log');
    return;
  }

  const event: BotLogEvent = { botId, log };
  io.to(`bot:${botId}`).emit('bot:log', event);
}

/**
 * Broadcasts a position update to all subscribed clients
 */
export function broadcastBotPosition(botId: string, position: Position): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast position');
    return;
  }

  const event: BotPositionEvent = { botId, position };
  io.to(`bot:${botId}`).emit('bot:position', event);
}

/**
 * Broadcasts an inventory update to all subscribed clients
 */
export function broadcastBotInventory(botId: string, inventory: InventoryItem[]): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast inventory');
    return;
  }

  const event: BotInventoryEvent = { botId, inventory };
  io.to(`bot:${botId}`).emit('bot:inventory', event);
}

/**
 * Broadcasts an error to all subscribed clients
 */
export function broadcastBotError(botId: string, error: string): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot broadcast error');
    return;
  }

  const event: BotErrorEvent = { botId, error };
  io.to(`bot:${botId}`).emit('bot:error', event);
}

/**
 * Gets the number of clients subscribed to a specific bot
 */
export function getSubscriberCount(botId: string): number {
  return subscriptions.get(botId)?.size ?? 0;
}

/**
 * Gets all bot IDs that have active subscribers
 */
export function getActiveSubscriptions(): string[] {
  return Array.from(subscriptions.keys());
}

/**
 * Gets the Socket.IO server instance
 */
export function getIO(): TypedServer | null {
  return io;
}
