import { APIKeys, APIKeyStatus } from '../../../shared/types/index.js';
declare const KEYS_FILE: string;
/**
 * Reads all API keys from the keys.json file
 */
export declare function getAllAPIKeys(): Promise<APIKeys>;
/**
 * Gets the status of all API keys (configured or not)
 * Does NOT return actual key values for security
 */
export declare function getAPIKeyStatuses(): Promise<APIKeyStatus[]>;
/**
 * Gets a single API key by provider
 * Returns the actual key value (use with caution)
 */
export declare function getAPIKeyByProvider(provider: string): Promise<string | null>;
/**
 * Updates an API key for a specific provider
 */
export declare function updateAPIKey(provider: string, key: string): Promise<boolean>;
/**
 * Deletes an API key for a specific provider
 */
export declare function deleteAPIKey(provider: string): Promise<boolean>;
/**
 * Checks if a provider is valid
 */
export declare function isValidProvider(provider: string): boolean;
export { KEYS_FILE };
