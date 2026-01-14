import { Server } from 'socket.io';
import { BotStatus, LogEntry, Position, InventoryItem, ServerToClientEvents, ClientToServerEvents } from '../../../shared/types/index.js';
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
/**
 * Initializes the WebSocket service with the Socket.IO server instance
 */
export declare function initializeWebSocket(server: TypedServer): void;
/**
 * Broadcasts a bot status update to all subscribed clients
 */
export declare function broadcastBotStatus(botId: string, status: BotStatus): void;
/**
 * Broadcasts a log entry to all subscribed clients
 */
export declare function broadcastBotLog(botId: string, log: LogEntry): void;
/**
 * Broadcasts a position update to all subscribed clients
 */
export declare function broadcastBotPosition(botId: string, position: Position): void;
/**
 * Broadcasts an inventory update to all subscribed clients
 */
export declare function broadcastBotInventory(botId: string, inventory: InventoryItem[]): void;
/**
 * Broadcasts an error to all subscribed clients
 */
export declare function broadcastBotError(botId: string, error: string): void;
/**
 * Gets the number of clients subscribed to a specific bot
 */
export declare function getSubscriberCount(botId: string): number;
/**
 * Gets all bot IDs that have active subscribers
 */
export declare function getActiveSubscriptions(): string[];
/**
 * Gets the Socket.IO server instance
 */
export declare function getIO(): TypedServer | null;
export {};
