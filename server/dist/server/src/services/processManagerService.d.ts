import { BotStatus, LogEntry, LogLevel, Position, InventoryItem } from '../../../shared/types/index.js';
declare const MINDCRAFT_PATH: string;
type StatusCallback = (botId: string, status: BotStatus) => void;
type LogCallback = (botId: string, log: LogEntry) => void;
type PositionCallback = (botId: string, position: Position) => void;
type InventoryCallback = (botId: string, inventory: InventoryItem[]) => void;
/**
 * Sets the callback for status changes
 */
export declare function setStatusChangeCallback(callback: StatusCallback): void;
/**
 * Sets the callback for log messages
 */
export declare function setLogCallback(callback: LogCallback): void;
/**
 * Sets the callback for position updates
 */
export declare function setPositionCallback(callback: PositionCallback): void;
/**
 * Sets the callback for inventory updates
 */
export declare function setInventoryCallback(callback: InventoryCallback): void;
/**
 * Gets the status of a bot
 */
export declare function getBotStatus(botId: string): BotStatus;
/**
 * Gets all running bot statuses
 */
export declare function getAllBotStatuses(): Map<string, BotStatus>;
/**
 * Gets the recent logs for a bot
 */
export declare function getBotLogs(botId: string, limit?: number): LogEntry[];
/**
 * Parses log level from output line
 */
declare function parseLogLevel(line: string): LogLevel;
/**
 * Strips ANSI escape codes from a string
 */
declare function stripAnsiCodes(text: string): string;
/**
 * Validates that required API keys are configured for a bot profile
 */
export declare function validateBotStartPrerequisites(botId: string): Promise<{
    valid: boolean;
    missingKeys: string[];
}>;
/**
 * Starts a bot
 */
export declare function startBot(botId: string, _taskId?: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Stops a bot
 */
export declare function stopBot(botId: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Checks if a bot is running
 */
export declare function isBotRunning(botId: string): boolean;
/**
 * Gets the count of running bots
 */
export declare function getRunningBotCount(): number;
/**
 * Stops all running bots
 */
export declare function stopAllBots(): Promise<void>;
export { MINDCRAFT_PATH, stripAnsiCodes, parseLogLevel };
