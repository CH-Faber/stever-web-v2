import { promises as fs } from 'fs';
import path from 'path';
import { BotProfile, BotModes, BotBehaviorSettings, ModelConfig, ValidationResult, ValidationError } from '../../../shared/types/index.js';

// Default profiles directory - can be configured via environment variable
const PROFILES_DIR = process.env.PROFILES_DIR || path.join(process.cwd(), '..', 'profiles');

// Default bot modes
const DEFAULT_BOT_MODES: BotModes = {
  self_preservation: true,
  unstuck: true,
  cowardice: false,
  self_defense: true,
  hunting: true,
  item_collecting: true,
  torch_placing: true,
  idle_staring: true,
  cheat: false,
};

// Default behavior settings
const DEFAULT_BEHAVIOR: BotBehaviorSettings = {
  cooldown: 3000,
  max_messages: 15,
  num_examples: 2,
  max_commands: -1,
  relevant_docs_count: 5,
  code_timeout_mins: -1,
  narrate_behavior: true,
  chat_bot_messages: true,
  load_memory: true,  // ✅ 默认启用记忆加载
  allow_vision: false,
  language: 'zh-CN',
  init_message: 'Respond with hello world and your name',
  only_chat_with: [],
  speak: false,
  chat_ingame: true,
  show_command_syntax: 'full',
  spawn_timeout: 30,
  block_place_delay: 0,
  base_profile: 'assistant',
};

// Default prompts
const DEFAULT_PROMPTS = {
  conversing: 'You are a helpful Minecraft assistant.',
  coding: 'You are a coding assistant for Minecraft bots.',
  saving_memory: 'Save important information to memory.',
};

/**
 * Migrates old language codes to new format
 */
function migrateBehaviorSettings(behavior?: Partial<BotBehaviorSettings>): BotBehaviorSettings {
  if (!behavior) {
    return { ...DEFAULT_BEHAVIOR };
  }

  const migrated = { ...DEFAULT_BEHAVIOR, ...behavior };
  
  // Migrate old language codes to google-translate-api-x compatible codes
  if (migrated.language === 'zh') {
    migrated.language = 'zh-CN';  // google-translate-api-x uses 'zh-CN' for simplified Chinese
  } else if (migrated.language === 'zh-cn') {
    migrated.language = 'zh-CN';  // Ensure correct case
  } else if (migrated.language === 'zh-tw') {
    migrated.language = 'zh-TW';  // Ensure correct case for traditional Chinese
  }
  
  return migrated;
}

/**
 * Ensures the profiles directory exists
 */
async function ensureProfilesDir(): Promise<void> {
  try {
    await fs.access(PROFILES_DIR);
  } catch {
    await fs.mkdir(PROFILES_DIR, { recursive: true });
  }
}

/**
 * Generates a unique ID for a new bot profile
 */
function generateId(): string {
  return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets the file path for a bot profile
 */
function getProfilePath(id: string): string {
  return path.join(PROFILES_DIR, `${id}.json`);
}


/**
 * Validates a bot profile configuration
 */
export function validateBotProfile(profile: Partial<BotProfile>): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!profile.name || typeof profile.name !== 'string' || profile.name.trim() === '') {
    errors.push({ field: 'name', message: 'Bot name is required' });
  }

  if (!profile.model) {
    errors.push({ field: 'model', message: 'Model configuration is required' });
  } else {
    if (!profile.model.api || typeof profile.model.api !== 'string') {
      errors.push({ field: 'model.api', message: 'Model API provider is required' });
    }
    if (!profile.model.model || typeof profile.model.model !== 'string') {
      errors.push({ field: 'model.model', message: 'Model name is required' });
    }
  }

  // Validate optional model configs if provided
  if (profile.codeModel) {
    if (!profile.codeModel.api) {
      errors.push({ field: 'codeModel.api', message: 'Code model API provider is required when codeModel is specified' });
    }
    if (!profile.codeModel.model) {
      errors.push({ field: 'codeModel.model', message: 'Code model name is required when codeModel is specified' });
    }
  }

  if (profile.visionModel) {
    if (!profile.visionModel.api) {
      errors.push({ field: 'visionModel.api', message: 'Vision model API provider is required when visionModel is specified' });
    }
    if (!profile.visionModel.model) {
      errors.push({ field: 'visionModel.model', message: 'Vision model name is required when visionModel is specified' });
    }
  }

  if (profile.embedding) {
    if (!profile.embedding.api) {
      errors.push({ field: 'embedding.api', message: 'Embedding API provider is required when embedding is specified' });
    }
    if (!profile.embedding.model) {
      errors.push({ field: 'embedding.model', message: 'Embedding model name is required when embedding is specified' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reads all bot profiles from the profiles directory
 */
export async function getAllBotProfiles(): Promise<BotProfile[]> {
  await ensureProfilesDir();
  
  const files = await fs.readdir(PROFILES_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const profiles: BotProfile[] = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = path.join(PROFILES_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const profile = JSON.parse(content) as BotProfile;
      
      // Ensure the profile has an id (use filename without extension if not)
      if (!profile.id) {
        profile.id = path.basename(file, '.json');
      }
      
      // Migrate behavior settings if needed
      let needsSave = false;
      if (profile.behavior) {
        const migratedBehavior = migrateBehaviorSettings(profile.behavior);
        if (JSON.stringify(migratedBehavior) !== JSON.stringify(profile.behavior)) {
          profile.behavior = migratedBehavior;
          needsSave = true;
        }
      }
      
      // Save migrated profile back to disk
      if (needsSave) {
        await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
      }
      
      profiles.push(profile);
    } catch (error) {
      console.error(`Error reading profile ${file}:`, error);
      // Skip invalid files
    }
  }
  
  return profiles;
}


/**
 * Gets a single bot profile by ID
 */
export async function getBotProfileById(id: string): Promise<BotProfile | null> {
  await ensureProfilesDir();
  
  const filePath = getProfilePath(id);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const profile = JSON.parse(content) as BotProfile;
    
    // Ensure the profile has the correct id
    if (!profile.id) {
      profile.id = id;
    }
    
    // Migrate behavior settings if needed
    if (profile.behavior) {
      profile.behavior = migrateBehaviorSettings(profile.behavior);
      // Save the migrated profile back to disk
      await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
    }
    
    return profile;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Creates a new bot profile
 */
export async function createBotProfile(data: Omit<BotProfile, 'id'>): Promise<BotProfile> {
  await ensureProfilesDir();
  
  const id = generateId();
  
  // IMPORTANT: Do NOT set default values for conversing, coding, saving_memory!
  // These prompts contain critical placeholders ($COMMAND_DOCS, $EXAMPLES, etc.)
  // in mindcraft's _default.json. If we set simple defaults here, they will
  // override the complete prompts and the bot won't know about available commands.
  // Let mindcraft use its defaults from profiles/defaults/_default.json
  const profile: BotProfile = {
    id,
    name: data.name,
    model: data.model,
    codeModel: data.codeModel,
    visionModel: data.visionModel,
    embedding: data.embedding,
    speakModel: data.speakModel,
    // Only include prompts if explicitly provided by user
    conversing: data.conversing || '',
    coding: data.coding || '',
    saving_memory: data.saving_memory || '',
    modes: data.modes || { ...DEFAULT_BOT_MODES },
    behavior: migrateBehaviorSettings(data.behavior),
  };
  
  const filePath = getProfilePath(id);
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
  
  return profile;
}

/**
 * Updates an existing bot profile
 */
export async function updateBotProfile(id: string, data: Partial<BotProfile>): Promise<BotProfile | null> {
  const existingProfile = await getBotProfileById(id);
  
  if (!existingProfile) {
    return null;
  }
  
  // Merge the existing profile with the updates
  const updatedProfile: BotProfile = {
    ...existingProfile,
    ...data,
    id, // Ensure ID cannot be changed
    model: data.model || existingProfile.model,
    modes: data.modes ? { ...existingProfile.modes, ...data.modes } : existingProfile.modes,
    behavior: migrateBehaviorSettings(data.behavior ? { ...existingProfile.behavior, ...data.behavior } : existingProfile.behavior),
  };
  
  const filePath = getProfilePath(id);
  await fs.writeFile(filePath, JSON.stringify(updatedProfile, null, 2), 'utf-8');
  
  return updatedProfile;
}

/**
 * Deletes a bot profile
 */
export async function deleteBotProfile(id: string): Promise<boolean> {
  const filePath = getProfilePath(id);
  
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a bot profile exists
 */
export async function botProfileExists(id: string): Promise<boolean> {
  const filePath = getProfilePath(id);
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export { PROFILES_DIR, DEFAULT_BOT_MODES, DEFAULT_BEHAVIOR, DEFAULT_PROMPTS };
