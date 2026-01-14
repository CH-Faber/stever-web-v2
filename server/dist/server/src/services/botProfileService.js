import { promises as fs } from 'fs';
import path from 'path';
// Default profiles directory - can be configured via environment variable
const PROFILES_DIR = process.env.PROFILES_DIR || path.join(process.cwd(), '..', 'profiles');
// Default bot modes
const DEFAULT_BOT_MODES = {
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
// Default prompts
const DEFAULT_PROMPTS = {
    conversing: 'You are a helpful Minecraft assistant.',
    coding: 'You are a coding assistant for Minecraft bots.',
    saving_memory: 'Save important information to memory.',
};
/**
 * Ensures the profiles directory exists
 */
async function ensureProfilesDir() {
    try {
        await fs.access(PROFILES_DIR);
    }
    catch {
        await fs.mkdir(PROFILES_DIR, { recursive: true });
    }
}
/**
 * Generates a unique ID for a new bot profile
 */
function generateId() {
    return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Gets the file path for a bot profile
 */
function getProfilePath(id) {
    return path.join(PROFILES_DIR, `${id}.json`);
}
/**
 * Validates a bot profile configuration
 */
export function validateBotProfile(profile) {
    const errors = [];
    // Check required fields
    if (!profile.name || typeof profile.name !== 'string' || profile.name.trim() === '') {
        errors.push({ field: 'name', message: 'Bot name is required' });
    }
    if (!profile.model) {
        errors.push({ field: 'model', message: 'Model configuration is required' });
    }
    else {
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
export async function getAllBotProfiles() {
    await ensureProfilesDir();
    const files = await fs.readdir(PROFILES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const profiles = [];
    for (const file of jsonFiles) {
        try {
            const filePath = path.join(PROFILES_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const profile = JSON.parse(content);
            // Ensure the profile has an id (use filename without extension if not)
            if (!profile.id) {
                profile.id = path.basename(file, '.json');
            }
            profiles.push(profile);
        }
        catch (error) {
            console.error(`Error reading profile ${file}:`, error);
            // Skip invalid files
        }
    }
    return profiles;
}
/**
 * Gets a single bot profile by ID
 */
export async function getBotProfileById(id) {
    await ensureProfilesDir();
    const filePath = getProfilePath(id);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const profile = JSON.parse(content);
        // Ensure the profile has the correct id
        if (!profile.id) {
            profile.id = id;
        }
        return profile;
    }
    catch (error) {
        // File doesn't exist or is invalid
        return null;
    }
}
/**
 * Creates a new bot profile
 */
export async function createBotProfile(data) {
    await ensureProfilesDir();
    const id = generateId();
    const profile = {
        id,
        name: data.name,
        model: data.model,
        codeModel: data.codeModel,
        visionModel: data.visionModel,
        embedding: data.embedding,
        speakModel: data.speakModel,
        conversing: data.conversing || DEFAULT_PROMPTS.conversing,
        coding: data.coding || DEFAULT_PROMPTS.coding,
        saving_memory: data.saving_memory || DEFAULT_PROMPTS.saving_memory,
        modes: data.modes || { ...DEFAULT_BOT_MODES },
    };
    const filePath = getProfilePath(id);
    await fs.writeFile(filePath, JSON.stringify(profile, null, 2), 'utf-8');
    return profile;
}
/**
 * Updates an existing bot profile
 */
export async function updateBotProfile(id, data) {
    const existingProfile = await getBotProfileById(id);
    if (!existingProfile) {
        return null;
    }
    // Merge the existing profile with the updates
    const updatedProfile = {
        ...existingProfile,
        ...data,
        id, // Ensure ID cannot be changed
        model: data.model || existingProfile.model,
        modes: data.modes ? { ...existingProfile.modes, ...data.modes } : existingProfile.modes,
    };
    const filePath = getProfilePath(id);
    await fs.writeFile(filePath, JSON.stringify(updatedProfile, null, 2), 'utf-8');
    return updatedProfile;
}
/**
 * Deletes a bot profile
 */
export async function deleteBotProfile(id) {
    const filePath = getProfilePath(id);
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks if a bot profile exists
 */
export async function botProfileExists(id) {
    const filePath = getProfilePath(id);
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export { PROFILES_DIR, DEFAULT_BOT_MODES, DEFAULT_PROMPTS };
