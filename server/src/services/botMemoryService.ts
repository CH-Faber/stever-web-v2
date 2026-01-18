import { promises as fs } from 'fs';
import path from 'path';
import { BotMemory } from '../../../shared/types/index.js';

// Mindcraft bots directory - can be configured via environment variable
const MINDCRAFT_BOTS_DIR = process.env.MINDCRAFT_BOTS_DIR || path.join(process.cwd(), '..', 'mindcraft', 'bots');

/**
 * Gets the memory file path for a bot
 */
function getMemoryPath(botName: string): string {
  return path.join(MINDCRAFT_BOTS_DIR, botName, 'memory.json');
}

/**
 * Gets the memory for a bot by its name
 */
export async function getBotMemoryByName(botName: string): Promise<BotMemory | null> {
  const memoryPath = getMemoryPath(botName);
  
  try {
    const content = await fs.readFile(memoryPath, 'utf-8');
    const memory = JSON.parse(content) as BotMemory;
    return memory;
  } catch (error) {
    // Memory file doesn't exist or is invalid
    return null;
  }
}

/**
 * Checks if a bot memory file exists
 */
export async function botMemoryExists(botName: string): Promise<boolean> {
  const memoryPath = getMemoryPath(botName);
  
  try {
    await fs.access(memoryPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets memory statistics for a bot
 */
export async function getBotMemoryStats(botName: string): Promise<{
  memoryLength: number;
  turnCount: number;
  lastActivity: Date | null;
} | null> {
  const memory = await getBotMemoryByName(botName);
  
  if (!memory) {
    return null;
  }
  
  return {
    memoryLength: memory.memory.length,
    turnCount: memory.turns.length,
    lastActivity: memory.taskStart ? new Date(memory.taskStart) : null,
  };
}

export { MINDCRAFT_BOTS_DIR };