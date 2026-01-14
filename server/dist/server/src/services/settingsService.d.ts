import { ServerSettings, ValidationResult } from '../../../shared/types/index.js';
declare const SETTINGS_FILE: string;
declare const DEFAULT_SETTINGS: ServerSettings;
declare const SUPPORTED_VERSIONS: string[];
/**
 * Validates server settings
 */
export declare function validateSettings(settings: Partial<ServerSettings>): ValidationResult;
/**
 * Reads server settings from the settings file
 */
export declare function getSettings(): Promise<ServerSettings>;
/**
 * Updates server settings
 */
export declare function updateSettings(updates: Partial<ServerSettings>): Promise<ServerSettings>;
export { SETTINGS_FILE, DEFAULT_SETTINGS, SUPPORTED_VERSIONS };
