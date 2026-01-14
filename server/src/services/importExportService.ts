import {
  BotProfile,
  ServerSettings,
  Task,
  ExportResponse,
  ImportRequest,
  ValidationResult,
  ValidationError,
} from '../../../shared/types/index.js';
import { getAllBotProfiles, createBotProfile, validateBotProfile } from './botProfileService.js';
import { getSettings, updateSettings, validateSettings } from './settingsService.js';
import { getAllTasks, createTask, validateTask } from './taskService.js';

/**
 * Exports all configuration data (bots, settings, tasks) as a single JSON object
 */
export async function exportAllConfig(): Promise<ExportResponse> {
  const [bots, settings, tasks] = await Promise.all([
    getAllBotProfiles(),
    getSettings(),
    getAllTasks(),
  ]);

  return {
    bots,
    settings,
    tasks,
  };
}

/**
 * Validates the structure of an import request
 */
export function validateImportData(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'Import data must be a valid JSON object' });
    return { valid: false, errors };
  }

  const importData = data as ImportRequest;

  // Validate bots array if provided
  if (importData.bots !== undefined) {
    if (!Array.isArray(importData.bots)) {
      errors.push({ field: 'bots', message: 'Bots must be an array' });
    } else {
      importData.bots.forEach((bot, index) => {
        const botValidation = validateBotProfile(bot);
        if (!botValidation.valid) {
          botValidation.errors.forEach(err => {
            errors.push({ field: `bots[${index}].${err.field}`, message: err.message });
          });
        }
      });
    }
  }

  // Validate settings if provided
  if (importData.settings !== undefined) {
    if (typeof importData.settings !== 'object' || importData.settings === null) {
      errors.push({ field: 'settings', message: 'Settings must be an object' });
    } else {
      const settingsValidation = validateSettings(importData.settings);
      if (!settingsValidation.valid) {
        settingsValidation.errors.forEach(err => {
          errors.push({ field: `settings.${err.field}`, message: err.message });
        });
      }
    }
  }

  // Validate tasks array if provided
  if (importData.tasks !== undefined) {
    if (!Array.isArray(importData.tasks)) {
      errors.push({ field: 'tasks', message: 'Tasks must be an array' });
    } else {
      importData.tasks.forEach((task, index) => {
        const taskValidation = validateTask(task);
        if (!taskValidation.valid) {
          taskValidation.errors.forEach(err => {
            errors.push({ field: `tasks[${index}].${err.field}`, message: err.message });
          });
        }
      });
    }
  }

  // Check if at least one section is provided
  if (importData.bots === undefined && importData.settings === undefined && importData.tasks === undefined) {
    errors.push({ field: 'root', message: 'Import data must contain at least one of: bots, settings, tasks' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


/**
 * Imports configuration data (bots, settings, tasks)
 * Returns the count of imported items
 */
export async function importConfig(data: ImportRequest): Promise<{
  bots: number;
  settings: boolean;
  tasks: number;
}> {
  const result = {
    bots: 0,
    settings: false,
    tasks: 0,
  };

  // Import bots
  if (data.bots && Array.isArray(data.bots)) {
    for (const bot of data.bots) {
      try {
        // Create bot without the id (will generate new id)
        const { id, ...botData } = bot;
        await createBotProfile(botData);
        result.bots++;
      } catch (error) {
        console.error(`Error importing bot ${bot.name}:`, error);
        // Continue with other bots
      }
    }
  }

  // Import settings
  if (data.settings) {
    try {
      await updateSettings(data.settings);
      result.settings = true;
    } catch (error) {
      console.error('Error importing settings:', error);
    }
  }

  // Import tasks
  if (data.tasks && Array.isArray(data.tasks)) {
    for (const task of data.tasks) {
      try {
        // Create task without the id (will generate new id)
        const { id, ...taskData } = task;
        await createTask(taskData);
        result.tasks++;
      } catch (error) {
        console.error(`Error importing task ${task.name}:`, error);
        // Continue with other tasks
      }
    }
  }

  return result;
}

/**
 * Validates JSON string and parses it
 */
export function parseImportJson(jsonString: string): { data: ImportRequest | null; error: string | null } {
  try {
    const data = JSON.parse(jsonString);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'Invalid JSON format' };
  }
}
