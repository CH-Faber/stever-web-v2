import { promises as fs } from 'fs';
import path from 'path';
import { ServerSettings, ValidationResult, ValidationError } from '../../../shared/types/index.js';

// Default settings file path - can be configured via environment variable
const SETTINGS_FILE = process.env.SETTINGS_FILE || path.join(process.cwd(), '..', 'settings.json');

// Default server settings
const DEFAULT_SETTINGS: ServerSettings = {
  host: 'localhost',
  port: 55916,
  auth: 'offline',
  version: '1.20.4',
  allowInsecureCoding: false,
};

// Supported Minecraft versions
const SUPPORTED_VERSIONS = [
  '1.21.6', '1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
  '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
];

/**
 * Ensures the settings file exists with default values
 */
async function ensureSettingsFile(): Promise<void> {
  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    // Create directory if needed
    const dir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    // Create default settings file
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
  }
}

/**
 * Validates server settings
 */
export function validateSettings(settings: Partial<ServerSettings>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate host
  if (settings.host !== undefined) {
    if (typeof settings.host !== 'string' || settings.host.trim() === '') {
      errors.push({ field: 'host', message: 'Host must be a non-empty string' });
    }
  }

  // Validate port
  if (settings.port !== undefined) {
    if (typeof settings.port !== 'number' || !Number.isInteger(settings.port)) {
      errors.push({ field: 'port', message: 'Port must be an integer' });
    } else if (settings.port < 1 || settings.port > 65535) {
      errors.push({ field: 'port', message: 'Port must be between 1 and 65535' });
    }
  }

  // Validate auth mode
  if (settings.auth !== undefined) {
    if (settings.auth !== 'offline' && settings.auth !== 'microsoft') {
      errors.push({ field: 'auth', message: "Auth must be 'offline' or 'microsoft'" });
    }
  }

  // Validate version
  if (settings.version !== undefined) {
    if (typeof settings.version !== 'string') {
      errors.push({ field: 'version', message: 'Version must be a string' });
    } else if (!SUPPORTED_VERSIONS.includes(settings.version)) {
      errors.push({ 
        field: 'version', 
        message: `Version must be one of: ${SUPPORTED_VERSIONS.slice(0, 5).join(', ')}...` 
      });
    }
  }

  // Validate allowInsecureCoding
  if (settings.allowInsecureCoding !== undefined) {
    if (typeof settings.allowInsecureCoding !== 'boolean') {
      errors.push({ field: 'allowInsecureCoding', message: 'allowInsecureCoding must be a boolean' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reads server settings from the settings file
 */
export async function getSettings(): Promise<ServerSettings> {
  await ensureSettingsFile();

  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(content) as Partial<ServerSettings>;
    
    // Merge with defaults to ensure all fields are present
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
    };
  } catch (error) {
    console.error('Error reading settings file:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates server settings
 */
export async function updateSettings(updates: Partial<ServerSettings>): Promise<ServerSettings> {
  await ensureSettingsFile();

  // Get current settings
  const currentSettings = await getSettings();

  // Merge updates with current settings
  const newSettings: ServerSettings = {
    ...currentSettings,
    ...updates,
  };

  // Write updated settings
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
    return newSettings;
  } catch (error) {
    console.error('Error writing settings file:', error);
    throw new Error('Failed to save settings');
  }
}

export { SETTINGS_FILE, DEFAULT_SETTINGS, SUPPORTED_VERSIONS };
