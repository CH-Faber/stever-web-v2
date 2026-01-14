import { promises as fs } from 'fs';
import path from 'path';
import { LLM_PROVIDER_INFO } from '../../../shared/types/index.js';
// Default keys file path - can be configured via environment variable
const KEYS_FILE = process.env.KEYS_FILE || path.join(process.cwd(), '..', 'keys.json');
/**
 * Ensures the keys file exists with an empty object
 */
async function ensureKeysFile() {
    try {
        await fs.access(KEYS_FILE);
    }
    catch {
        // Create directory if needed
        const dir = path.dirname(KEYS_FILE);
        await fs.mkdir(dir, { recursive: true });
        // Create empty keys file
        await fs.writeFile(KEYS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
}
/**
 * Reads all API keys from the keys.json file
 */
export async function getAllAPIKeys() {
    await ensureKeysFile();
    try {
        const content = await fs.readFile(KEYS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('Error reading keys file:', error);
        return {};
    }
}
/**
 * Gets the status of all API keys (configured or not)
 * Does NOT return actual key values for security
 */
export async function getAPIKeyStatuses() {
    const keys = await getAllAPIKeys();
    return LLM_PROVIDER_INFO.map(provider => ({
        provider: provider.id,
        configured: !!keys[provider.keyName] && keys[provider.keyName].trim() !== '',
    }));
}
/**
 * Gets a single API key by provider
 * Returns the actual key value (use with caution)
 */
export async function getAPIKeyByProvider(provider) {
    const providerInfo = LLM_PROVIDER_INFO.find(p => p.id === provider);
    if (!providerInfo) {
        return null;
    }
    const keys = await getAllAPIKeys();
    const key = keys[providerInfo.keyName];
    return key && key.trim() !== '' ? key : null;
}
/**
 * Updates an API key for a specific provider
 */
export async function updateAPIKey(provider, key) {
    const providerInfo = LLM_PROVIDER_INFO.find(p => p.id === provider);
    if (!providerInfo) {
        return false;
    }
    await ensureKeysFile();
    const keys = await getAllAPIKeys();
    keys[providerInfo.keyName] = key;
    try {
        await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
        return true;
    }
    catch (error) {
        console.error('Error writing keys file:', error);
        return false;
    }
}
/**
 * Deletes an API key for a specific provider
 */
export async function deleteAPIKey(provider) {
    const providerInfo = LLM_PROVIDER_INFO.find(p => p.id === provider);
    if (!providerInfo) {
        return false;
    }
    await ensureKeysFile();
    const keys = await getAllAPIKeys();
    // Check if key exists
    if (!keys[providerInfo.keyName]) {
        return false;
    }
    delete keys[providerInfo.keyName];
    try {
        await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
        return true;
    }
    catch (error) {
        console.error('Error writing keys file:', error);
        return false;
    }
}
/**
 * Checks if a provider is valid
 */
export function isValidProvider(provider) {
    return LLM_PROVIDER_INFO.some(p => p.id === provider);
}
export { KEYS_FILE };
