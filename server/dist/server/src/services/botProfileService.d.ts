import { BotProfile, BotModes, ValidationResult } from '../../../shared/types/index.js';
declare const PROFILES_DIR: string;
declare const DEFAULT_BOT_MODES: BotModes;
declare const DEFAULT_PROMPTS: {
    conversing: string;
    coding: string;
    saving_memory: string;
};
/**
 * Validates a bot profile configuration
 */
export declare function validateBotProfile(profile: Partial<BotProfile>): ValidationResult;
/**
 * Reads all bot profiles from the profiles directory
 */
export declare function getAllBotProfiles(): Promise<BotProfile[]>;
/**
 * Gets a single bot profile by ID
 */
export declare function getBotProfileById(id: string): Promise<BotProfile | null>;
/**
 * Creates a new bot profile
 */
export declare function createBotProfile(data: Omit<BotProfile, 'id'>): Promise<BotProfile>;
/**
 * Updates an existing bot profile
 */
export declare function updateBotProfile(id: string, data: Partial<BotProfile>): Promise<BotProfile | null>;
/**
 * Deletes a bot profile
 */
export declare function deleteBotProfile(id: string): Promise<boolean>;
/**
 * Checks if a bot profile exists
 */
export declare function botProfileExists(id: string): Promise<boolean>;
export { PROFILES_DIR, DEFAULT_BOT_MODES, DEFAULT_PROMPTS };
