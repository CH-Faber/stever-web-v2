import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// @ts-ignore - tree-kill doesn't have type definitions
import treeKill from 'tree-kill';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { BotStatus, LogEntry, LogLevel, BotProfile, ModelConfig, Position, InventoryItem } from '../../../shared/types/index.js';
import { getBotProfileById } from './botProfileService.js';
import { getAPIKeyByProvider, getAllAPIKeys } from './apiKeyService.js';
import { getEndpointById } from './endpointService.js';
import { getSettings } from './settingsService.js';
import { LLM_PROVIDER_INFO } from '../../../shared/types/index.js';
import * as logStorage from './logStorageService.js';

// Mindcraft main.js path - can be configured via environment variable
const MINDCRAFT_PATH = process.env.MINDCRAFT_PATH || path.join(process.cwd(), '..');
const MINDCRAFT_PROFILES_DIR = path.join(MINDCRAFT_PATH, 'profiles');
const MINDCRAFT_KEYS_FILE = path.join(MINDCRAFT_PATH, 'keys.json');

// ANSI escape code regex for stripping colors from output
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

// Log level patterns for parsing
const LOG_LEVEL_PATTERNS = {
  error: [
    /\berror\b/i,
    /\bexception\b/i,
    /\bfailed\b/i,
    /\bfailure\b/i,
    /\bcritical\b/i,
    /\bfatal\b/i,
    /\[error\]/i,
    /\[err\]/i,
  ],
  warn: [
    /\bwarn(ing)?\b/i,
    /\[warn(ing)?\]/i,
    /\bcaution\b/i,
  ],
};

// ============================================
// Single Mindcraft Process Management
// ============================================

// The single Mindcraft process
let mindcraftProcess: ChildProcess | null = null;
let mindcraftProcessPid: number | undefined = undefined;

// Set of active bot IDs (bots that should be running)
const activeBotIds: Set<string> = new Set();

// Bot state tracking (for UI status updates)
interface BotState {
  status: BotStatus;
  logs: LogEntry[];
  profilePath?: string;
}

const botStates: Map<string, BotState> = new Map();

// Output buffer for the shared process
let processOutputBuffer: string = '';

// Event callbacks
type StatusCallback = (botId: string, status: BotStatus) => void;
type LogCallback = (botId: string, log: LogEntry) => void;
type PositionCallback = (botId: string, position: Position) => void;
type InventoryCallback = (botId: string, inventory: InventoryItem[]) => void;

let onStatusChange: StatusCallback | null = null;
let onLogMessage: LogCallback | null = null;
let onPositionUpdate: PositionCallback | null = null;
let onInventoryUpdate: InventoryCallback | null = null;

// MindServer connection
let mindServerSocket: ClientSocket | null = null;
const MINDSERVER_URL = 'http://localhost:8080';

/**
 * Sets the callback for status changes
 */
export function setStatusChangeCallback(callback: StatusCallback): void {
  onStatusChange = callback;
}

/**
 * Sets the callback for log messages
 */
export function setLogCallback(callback: LogCallback): void {
  onLogMessage = callback;
}

/**
 * Sets the callback for position updates
 */
export function setPositionCallback(callback: PositionCallback): void {
  onPositionUpdate = callback;
}

/**
 * Sets the callback for inventory updates
 */
export function setInventoryCallback(callback: InventoryCallback): void {
  onInventoryUpdate = callback;
}

/**
 * Gets the status of a bot
 */
export function getBotStatus(botId: string): BotStatus {
  const state = botStates.get(botId);
  if (!state) {
    return { status: 'offline' };
  }
  return state.status;
}

/**
 * Gets all running bot statuses
 */
export function getAllBotStatuses(): Map<string, BotStatus> {
  const statuses = new Map<string, BotStatus>();
  botStates.forEach((state, botId) => {
    statuses.set(botId, state.status);
  });
  return statuses;
}

/**
 * Gets the recent logs for a bot
 */
export function getBotLogs(botId: string, limit: number = 100): LogEntry[] {
  const state = botStates.get(botId);
  if (!state) {
    return [];
  }
  return state.logs.slice(-limit);
}

/**
 * Updates the status of a bot and notifies listeners
 */
function updateBotStatus(botId: string, status: Partial<BotStatus>): void {
  let state = botStates.get(botId);
  if (!state) {
    state = { status: { status: 'offline' }, logs: [] };
    botStates.set(botId, state);
  }
  state.status = { ...state.status, ...status };
  if (onStatusChange) {
    onStatusChange(botId, state.status);
  }
}

/**
 * Adds a log entry for a bot and notifies listeners
 */
function addLogEntry(botId: string, level: LogLevel, message: string, source: string = 'bot'): void {
  let state = botStates.get(botId);
  if (!state) {
    state = { status: { status: 'offline' }, logs: [] };
    botStates.set(botId, state);
  }
  
  const log: LogEntry = {
    timestamp: new Date(),
    level,
    message,
    source,
  };
  state.logs.push(log);
  
  // Keep only last 1000 logs in memory
  if (state.logs.length > 1000) {
    state.logs = state.logs.slice(-1000);
  }
  
  // 持久化日志到文件
  logStorage.writeLogEntry(botId, log).catch(err => {
    console.error(`[LogStorage] Failed to write log: ${err}`);
  });
  
  if (onLogMessage) {
    onLogMessage(botId, log);
  }
}

/**
 * Adds a log entry to all active bots (for shared process output)
 */
function addLogEntryToAllBots(level: LogLevel, message: string, source: string = 'bot'): void {
  // Log to all active bots since we can't determine which bot it's for
  activeBotIds.forEach(botId => {
    addLogEntry(botId, level, message, source);
  });
}

/**
 * Parses log level from output line
 */
function parseLogLevel(line: string): LogLevel {
  for (const pattern of LOG_LEVEL_PATTERNS.error) {
    if (pattern.test(line)) return 'error';
  }
  for (const pattern of LOG_LEVEL_PATTERNS.warn) {
    if (pattern.test(line)) return 'warn';
  }
  return 'info';
}

/**
 * Strips ANSI escape codes from a string
 */
function stripAnsiCodes(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

// Cache for bot names to avoid repeated DB lookups
const botNameCache: Map<string, string> = new Map();

async function getBotNameCached(botId: string): Promise<string | null> {
  if (botNameCache.has(botId)) {
    return botNameCache.get(botId) || null;
  }
  const profile = await getBotProfileById(botId);
  if (profile) {
    botNameCache.set(botId, profile.name);
    return profile.name;
  }
  return null;
}

// Reverse lookup: bot name -> bot ID
async function getBotIdByName(botName: string): Promise<string | null> {
  for (const botId of activeBotIds) {
    const name = await getBotNameCached(botId);
    if (name === botName) {
      return botId;
    }
  }
  return null;
}

/**
 * Connects to Mindcraft's MindServer to receive real-time bot data
 */
function connectToMindServer(): void {
  if (mindServerSocket?.connected) {
    console.log('[MindServer] Already connected');
    return;
  }

  console.log('[MindServer] Connecting to', MINDSERVER_URL);
  
  mindServerSocket = ioClient(MINDSERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 5000,
  });

  mindServerSocket.on('connect', () => {
    console.log('[MindServer] Connected');
  });

  mindServerSocket.on('disconnect', () => {
    console.log('[MindServer] Disconnected');
  });

  mindServerSocket.on('connect_error', (err: Error) => {
    console.log('[MindServer] Connection error:', err.message);
  });

  // Listen for agent updates from MindServer
  // MindServer sends updates in format: { name: string, position: {x, y, z}, inventory: [...] }
  mindServerSocket.on('agent-update', async (data: { 
    name: string; 
    position?: { x: number; y: number; z: number };
    inventory?: Array<{ name: string; count: number }>;
  }) => {
    const botId = await getBotIdByName(data.name);
    if (!botId) {
      console.log('[MindServer] Unknown agent:', data.name);
      return;
    }

    // Update position
    if (data.position && onPositionUpdate) {
      const position: Position = {
        x: data.position.x,
        y: data.position.y,
        z: data.position.z,
      };
      onPositionUpdate(botId, position);
    }

    // Update inventory
    if (data.inventory && onInventoryUpdate) {
      const inventory: InventoryItem[] = data.inventory.map((item, index) => ({
        slot: index,
        name: item.name,
        count: item.count,
      }));
      onInventoryUpdate(botId, inventory);
    }
  });

  // Also listen for position-specific events
  mindServerSocket.on('position', async (data: { name: string; x: number; y: number; z: number }) => {
    const botId = await getBotIdByName(data.name);
    if (botId && onPositionUpdate) {
      onPositionUpdate(botId, { x: data.x, y: data.y, z: data.z });
    }
  });
}

/**
 * Disconnects from MindServer
 */
function disconnectFromMindServer(): void {
  if (mindServerSocket) {
    console.log('[MindServer] Disconnecting');
    mindServerSocket.disconnect();
    mindServerSocket = null;
  }
}

/**
 * Processes output from the shared Mindcraft process
 */
async function processSharedOutput(data: Buffer, isStderr: boolean = false): Promise<void> {
  const text = processOutputBuffer + data.toString();
  const lines = text.split('\n');
  
  if (!text.endsWith('\n') && lines.length > 0) {
    processOutputBuffer = lines.pop() || '';
  } else {
    processOutputBuffer = '';
  }

  for (const rawLine of lines) {
    const line = stripAnsiCodes(rawLine).trim();
    if (!line) continue;

    const level: LogLevel = isStderr ? 'error' : parseLogLevel(line);
    const source = isStderr ? 'stderr' : 'stdout';
    
    // Try to route log to specific bot based on bot name in message
    let routed = false;
    for (const botId of activeBotIds) {
      // Check by bot name (cached)
      const botName = await getBotNameCached(botId);
      if (botName && line.includes(botName)) {
        addLogEntry(botId, level, line, source);
        routed = true;
        break;
      }
    }
    
    // If not routed, send to all active bots
    // This ensures error messages are visible to all bots
    if (!routed) {
      addLogEntryToAllBots(level, line, source);
    }
  }
}

// ============================================
// Profile and Key Management
// ============================================

/**
 * Validates that required API keys are configured for a bot profile
 */
export async function validateBotStartPrerequisites(botId: string): Promise<{ valid: boolean; missingKeys: string[] }> {
  const profile = await getBotProfileById(botId);
  if (!profile) {
    return { valid: false, missingKeys: [] };
  }

  const missingKeys: string[] = [];
  
  if (profile.model.api !== 'custom') {
    const mainProvider = LLM_PROVIDER_INFO.find(p => p.id === profile.model.api);
    if (mainProvider) {
      const key = await getAPIKeyByProvider(profile.model.api);
      if (!key) missingKeys.push(mainProvider.name);
    }
  }

  if (profile.codeModel && profile.codeModel.api !== 'custom') {
    const codeProvider = LLM_PROVIDER_INFO.find(p => p.id === profile.codeModel!.api);
    if (codeProvider) {
      const key = await getAPIKeyByProvider(profile.codeModel.api);
      if (!key && !missingKeys.includes(codeProvider.name)) {
        missingKeys.push(codeProvider.name);
      }
    }
  }

  if (profile.visionModel && profile.visionModel.api !== 'custom') {
    const visionProvider = LLM_PROVIDER_INFO.find(p => p.id === profile.visionModel!.api);
    if (visionProvider) {
      const key = await getAPIKeyByProvider(profile.visionModel.api);
      if (!key && !missingKeys.includes(visionProvider.name)) {
        missingKeys.push(visionProvider.name);
      }
    }
  }

  if (profile.embedding && profile.embedding.api !== 'custom') {
    const embeddingProvider = LLM_PROVIDER_INFO.find(p => p.id === profile.embedding!.api);
    if (embeddingProvider) {
      const key = await getAPIKeyByProvider(profile.embedding.api);
      if (!key && !missingKeys.includes(embeddingProvider.name)) {
        missingKeys.push(embeddingProvider.name);
      }
    }
  }

  return { valid: missingKeys.length === 0, missingKeys };
}

function normalizeApiUrl(url: string): string {
  let normalized = url.replace(/\/+$/, '');
  if (!normalized.endsWith('/v1')) {
    normalized = `${normalized}/v1`;
  }
  return normalized;
}

async function convertModelConfigToMindcraft(config: ModelConfig): Promise<{ config: Record<string, unknown>; customApiKey?: string }> {
  if (config.api === 'custom' && config.endpointId) {
    const endpoint = await getEndpointById(config.endpointId);
    if (endpoint) {
      return {
        config: {
          api: 'openai',
          model: config.model,
          url: normalizeApiUrl(endpoint.baseUrl),
          ...(config.params || {}),
        },
        customApiKey: endpoint.apiKey,
      };
    }
  }
  
  if (config.api === 'custom' && config.url) {
    return {
      config: {
        api: 'openai',
        model: config.model,
        url: normalizeApiUrl(config.url),
        ...(config.params || {}),
      },
    };
  }
  
  return {
    config: {
      api: config.api,
      model: config.model,
      ...(config.url ? { url: normalizeApiUrl(config.url) } : {}),
      ...(config.params || {}),
    },
  };
}

async function convertProfileToMindcraft(profile: BotProfile): Promise<{ profile: Record<string, unknown>; customApiKeys: string[] }> {
  const customApiKeys: string[] = [];
  
  const mainModel = await convertModelConfigToMindcraft(profile.model);
  if (mainModel.customApiKey) customApiKeys.push(mainModel.customApiKey);
  
  // IMPORTANT: Do NOT include conversing, coding, saving_memory here!
  // These prompts contain critical placeholders like $COMMAND_DOCS, $EXAMPLES, etc.
  // that are defined in mindcraft's _default.json. If we override them with simple
  // text, the bot won't know about available commands and won't use !commands.
  // Let mindcraft use its default prompts from profiles/defaults/_default.json
  const mindcraftProfile: Record<string, unknown> = {
    name: profile.name,
    model: mainModel.config,
    modes: profile.modes,
  };

  // Add behavior settings if provided (these override settings.js values per-bot)
  if (profile.behavior) {
    // cooldown is a profile-level setting in mindcraft
    if (profile.behavior.cooldown !== undefined) {
      mindcraftProfile.cooldown = profile.behavior.cooldown;
    }
  }

  if (profile.codeModel) {
    const codeModel = await convertModelConfigToMindcraft(profile.codeModel);
    mindcraftProfile.code_model = codeModel.config;
    if (codeModel.customApiKey && !customApiKeys.includes(codeModel.customApiKey)) {
      customApiKeys.push(codeModel.customApiKey);
    }
  }
  if (profile.visionModel) {
    const visionModel = await convertModelConfigToMindcraft(profile.visionModel);
    mindcraftProfile.vision_model = visionModel.config;
    if (visionModel.customApiKey && !customApiKeys.includes(visionModel.customApiKey)) {
      customApiKeys.push(visionModel.customApiKey);
    }
  }
  if (profile.embedding) {
    // Handle custom endpoint for embedding
    if (profile.embedding.api === 'custom' && profile.embedding.endpointId) {
      const endpoint = await getEndpointById(profile.embedding.endpointId);
      if (endpoint) {
        mindcraftProfile.embedding = {
          api: 'openai',
          model: profile.embedding.model,
          url: normalizeApiUrl(endpoint.baseUrl),
        };
        if (endpoint.apiKey && !customApiKeys.includes(endpoint.apiKey)) {
          customApiKeys.push(endpoint.apiKey);
        }
      } else {
        // Endpoint not found, skip embedding config
        console.warn(`[Mindcraft] Embedding endpoint ${profile.embedding.endpointId} not found, skipping embedding config`);
      }
    } else if (profile.embedding.api === 'custom' && profile.embedding.url) {
      mindcraftProfile.embedding = {
        api: 'openai',
        model: profile.embedding.model,
        url: normalizeApiUrl(profile.embedding.url),
      };
    } else if (profile.embedding.api === 'custom') {
      // Custom API without endpoint or URL - skip embedding to use default
      console.warn(`[Mindcraft] Embedding has custom API but no endpoint/url, skipping embedding config`);
    } else {
      mindcraftProfile.embedding = {
        api: profile.embedding.api,
        model: profile.embedding.model,
        ...(profile.embedding.url ? { url: profile.embedding.url } : {}),
      };
    }
  }
  if (profile.speakModel) {
    mindcraftProfile.speak_model = profile.speakModel;
  }

  return { profile: mindcraftProfile, customApiKeys };
}

async function syncProfileToMindcraft(profile: BotProfile): Promise<{ profilePath: string; customApiKeys: string[] }> {
  try {
    await fs.access(MINDCRAFT_PROFILES_DIR);
  } catch {
    await fs.mkdir(MINDCRAFT_PROFILES_DIR, { recursive: true });
  }

  const { profile: mindcraftProfile, customApiKeys } = await convertProfileToMindcraft(profile);
  const profilePath = path.join(MINDCRAFT_PROFILES_DIR, `${profile.id}.json`);
  
  await fs.writeFile(profilePath, JSON.stringify(mindcraftProfile, null, 2), 'utf-8');
  console.log(`Synced profile to: ${profilePath}`);
  
  return { profilePath, customApiKeys };
}

async function syncKeysToMindcraft(customApiKeys: string[] = []): Promise<Record<string, string>> {
  const keys = await getAllAPIKeys();
  const mindcraftKeys: Record<string, string> = {};
  
  for (const [keyName, value] of Object.entries(keys)) {
    if (value) mindcraftKeys[keyName] = value;
  }
  
  if (customApiKeys.length > 0 && !mindcraftKeys['OPENAI_API_KEY']) {
    mindcraftKeys['OPENAI_API_KEY'] = customApiKeys[0];
  }
  
  await fs.writeFile(MINDCRAFT_KEYS_FILE, JSON.stringify(mindcraftKeys, null, 2), 'utf-8');
  console.log(`Synced API keys to: ${MINDCRAFT_KEYS_FILE}`);
  
  return mindcraftKeys;
}

async function buildSettingsEnv(behaviorOverrides?: Record<string, unknown>): Promise<string> {
  const settings = await getSettings();
  
  // Default behavior settings
  const defaultBehavior = {
    load_memory: true,  // ✅ 默认启用记忆加载
    allow_vision: false,
    code_timeout_mins: -1,
    relevant_docs_count: 5,
    max_messages: 15,
    num_examples: 2,
    max_commands: -1,
    narrate_behavior: true,
    chat_bot_messages: true,
    language: 'zh-CN',
    init_message: 'Respond with hello world and your name',
    only_chat_with: [] as string[],
    speak: false,
    chat_ingame: true,
    show_command_syntax: 'full',
    spawn_timeout: 30,
    block_place_delay: 0,
    base_profile: 'assistant',
  };
  
  // Merge with overrides from bot behavior settings
  const behavior = { ...defaultBehavior, ...behaviorOverrides };
  
  const mindcraftSettings: Record<string, unknown> = {
    minecraft_version: settings.version,
    host: settings.host,
    port: settings.port,
    auth: settings.auth,
    allow_insecure_coding: settings.allowInsecureCoding,
    auto_open_ui: false,
    
    // Critical settings
    base_profile: behavior.base_profile,
    load_memory: behavior.load_memory,
    init_message: behavior.init_message,
    only_chat_with: behavior.only_chat_with,
    
    // Bot behavior settings
    speak: behavior.speak,
    chat_ingame: behavior.chat_ingame,
    language: behavior.language,
    render_bot_view: false,
    allow_vision: behavior.allow_vision,
    blocked_actions: ["!checkBlueprint", "!checkBlueprintLevel", "!getBlueprint", "!getBlueprintLevel"],
    code_timeout_mins: behavior.code_timeout_mins,
    relevant_docs_count: behavior.relevant_docs_count,
    
    // Message and command settings
    max_messages: behavior.max_messages,
    num_examples: behavior.num_examples,
    max_commands: behavior.max_commands,
    show_command_syntax: behavior.show_command_syntax,
    narrate_behavior: behavior.narrate_behavior,
    chat_bot_messages: behavior.chat_bot_messages,
    
    // Spawn and timing settings
    spawn_timeout: behavior.spawn_timeout,
    block_place_delay: behavior.block_place_delay,
    log_all_prompts: false,
  };
  
  return JSON.stringify(mindcraftSettings);
}


// ============================================
// Mindcraft Process Control
// ============================================

/**
 * Starts or restarts the Mindcraft process with all active bot profiles
 */
async function startOrRestartMindcraftProcess(): Promise<{ success: boolean; error?: string }> {
  // If no active bots, don't start
  if (activeBotIds.size === 0) {
    console.log('[Mindcraft] No active bots, not starting process');
    return { success: true };
  }

  // Stop existing process if running
  if (mindcraftProcess && mindcraftProcess.exitCode === null) {
    console.log('[Mindcraft] Stopping existing process before restart...');
    await stopMindcraftProcess();
  }

  // Collect all profile paths and custom API keys
  const profilePaths: string[] = [];
  const allCustomApiKeys: string[] = [];
  let firstBotBehavior: Record<string, unknown> | undefined;

  for (const botId of activeBotIds) {
    const profile = await getBotProfileById(botId);
    if (!profile) {
      console.log(`[Mindcraft] Profile not found for bot ${botId}, skipping`);
      continue;
    }

    // Use the first bot's behavior settings for global settings
    if (!firstBotBehavior && profile.behavior) {
      firstBotBehavior = {
        load_memory: profile.behavior.load_memory,
        allow_vision: profile.behavior.allow_vision,
        code_timeout_mins: profile.behavior.code_timeout_mins,
        relevant_docs_count: profile.behavior.relevant_docs_count,
        max_messages: profile.behavior.max_messages,
        num_examples: profile.behavior.num_examples,
        max_commands: profile.behavior.max_commands,
        narrate_behavior: profile.behavior.narrate_behavior,
        chat_bot_messages: profile.behavior.chat_bot_messages,
        language: profile.behavior.language,
        init_message: profile.behavior.init_message,
        only_chat_with: profile.behavior.only_chat_with,
        speak: profile.behavior.speak,
        chat_ingame: profile.behavior.chat_ingame,
        show_command_syntax: profile.behavior.show_command_syntax,
        spawn_timeout: profile.behavior.spawn_timeout,
        block_place_delay: profile.behavior.block_place_delay,
        base_profile: profile.behavior.base_profile,
      };
    }

    const { profilePath, customApiKeys } = await syncProfileToMindcraft(profile);
    profilePaths.push(path.relative(MINDCRAFT_PATH, profilePath));
    
    // Update bot state with profile path
    const state = botStates.get(botId);
    if (state) state.profilePath = profilePath;
    
    for (const key of customApiKeys) {
      if (!allCustomApiKeys.includes(key)) {
        allCustomApiKeys.push(key);
      }
    }
  }

  if (profilePaths.length === 0) {
    console.log('[Mindcraft] No valid profiles to start');
    return { success: false, error: 'No valid profiles' };
  }

  // Sync API keys
  const apiKeys = await syncKeysToMindcraft(allCustomApiKeys);
  
  // Build settings with behavior overrides from first bot
  const settingsJson = await buildSettingsEnv(firstBotBehavior);
  console.log(`[Mindcraft] Using settings: ${settingsJson}`);

  // Build command arguments with all profiles
  const args = ['main.js', '--profiles', ...profilePaths];
  console.log(`[Mindcraft] Starting with args: node ${args.join(' ')}`);

  // Update all bots to starting status
  for (const botId of activeBotIds) {
    updateBotStatus(botId, { status: 'starting', startTime: new Date() });
  }

  // Spawn the process
  const childProcess = spawn('node', args, {
    cwd: MINDCRAFT_PATH,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
    env: {
      ...process.env,
      SETTINGS_JSON: settingsJson,
      ...apiKeys,
    },
  });

  mindcraftProcess = childProcess;
  mindcraftProcessPid = childProcess.pid;
  processOutputBuffer = '';

  console.log(`[Mindcraft] Process started with PID: ${childProcess.pid}`);

  // Handle stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    console.log(`[Mindcraft] stdout: ${text.trim()}`);
    // Fire and forget - we don't need to await this
    processSharedOutput(data, false).catch(err => {
      console.error('[Mindcraft] Error processing stdout:', err);
    });
  });

  // Handle stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString();
    console.log(`[Mindcraft] stderr: ${text.trim()}`);
    // Fire and forget - we don't need to await this
    processSharedOutput(data, true).catch(err => {
      console.error('[Mindcraft] Error processing stderr:', err);
    });
  });

  // Handle process exit
  childProcess.on('exit', (code, signal) => {
    const exitMessage = `Mindcraft process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
    console.log(`[Mindcraft] ${exitMessage}`);
    
    // Update all active bots to error/offline status
    for (const botId of activeBotIds) {
      addLogEntry(botId, code === 0 ? 'info' : 'error', exitMessage, 'system');
      updateBotStatus(botId, {
        status: code === 0 ? 'offline' : 'error',
        error: code !== 0 ? exitMessage : undefined,
      });
    }
    
    mindcraftProcess = null;
    mindcraftProcessPid = undefined;
  });

  // Handle process error
  childProcess.on('error', (err) => {
    console.log(`[Mindcraft] Process error: ${err.message}`);
    for (const botId of activeBotIds) {
      addLogEntry(botId, 'error', `Process error: ${err.message}`, 'system');
      updateBotStatus(botId, { status: 'error', error: err.message });
    }
  });

  // Wait a short time to check if process started successfully
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (childProcess.exitCode !== null) {
    return { success: false, error: 'Process exited immediately' };
  }

  // Update all bots to online status
  for (const botId of activeBotIds) {
    updateBotStatus(botId, { status: 'online' });
    addLogEntry(botId, 'info', 'Bot started successfully', 'system');
  }

  // Connect to MindServer after a delay to allow it to start
  setTimeout(() => {
    connectToMindServer();
  }, 3000);

  return { success: true };
}

/**
 * Stops the Mindcraft process
 */
async function stopMindcraftProcess(): Promise<void> {
  // Disconnect from MindServer first
  disconnectFromMindServer();

  if (!mindcraftProcess || mindcraftProcess.exitCode !== null) {
    console.log('[Mindcraft] No process to stop');
    return;
  }

  const pid = mindcraftProcessPid;
  if (!pid) {
    console.log('[Mindcraft] No PID found');
    return;
  }

  console.log(`[Mindcraft] Stopping process with PID: ${pid}`);

  return new Promise((resolve) => {
    treeKill(pid, 'SIGTERM', (err: Error | undefined) => {
      if (err) {
        console.log(`[Mindcraft] SIGTERM failed: ${err.message}, trying SIGKILL...`);
      }

      const checkExit = async () => {
        await new Promise(r => setTimeout(r, 3000));

        if (mindcraftProcess?.exitCode !== null) {
          console.log('[Mindcraft] Process stopped gracefully');
          resolve();
          return;
        }

        console.log('[Mindcraft] Force killing process...');
        treeKill(pid, 'SIGKILL', async () => {
          await new Promise(r => setTimeout(r, 1000));
          resolve();
        });
      };

      checkExit();
    });
  });
}

// ============================================
// Public API
// ============================================

/**
 * Starts a bot
 */
export async function startBot(botId: string, _taskId?: string): Promise<{ success: boolean; error?: string }> {
  // Check if bot is already active
  if (activeBotIds.has(botId)) {
    const state = botStates.get(botId);
    if (state && (state.status.status === 'online' || state.status.status === 'starting')) {
      return { success: false, error: 'Bot is already running' };
    }
  }

  // Get bot profile
  const profile = await getBotProfileById(botId);
  if (!profile) {
    return { success: false, error: 'Bot profile not found' };
  }

  // Validate prerequisites
  const validation = await validateBotStartPrerequisites(botId);
  if (!validation.valid) {
    return { 
      success: false, 
      error: `Missing required API keys: ${validation.missingKeys.join(', ')}` 
    };
  }

  console.log(`[Bot ${botId}] Adding to active bots`);

  // Initialize bot state
  botStates.set(botId, {
    status: { status: 'starting', startTime: new Date() },
    logs: [],
  });
  
  // Add to active bots
  activeBotIds.add(botId);
  
  // 开始新的日志会话
  await logStorage.startLogSession(botId, profile.name).catch(err => {
    console.error(`[LogStorage] Failed to start log session: ${err}`);
  });
  
  addLogEntry(botId, 'info', 'Starting bot...', 'system');

  // Start or restart the Mindcraft process with all active bots
  const result = await startOrRestartMindcraftProcess();
  
  if (!result.success) {
    activeBotIds.delete(botId);
    updateBotStatus(botId, { status: 'error', error: result.error });
    addLogEntry(botId, 'error', `Failed to start: ${result.error}`, 'system');
  }

  return result;
}

/**
 * Stops a bot
 */
export async function stopBot(botId: string): Promise<{ success: boolean; error?: string }> {
  if (!activeBotIds.has(botId)) {
    return { success: false, error: 'Bot is not running' };
  }

  const state = botStates.get(botId);
  if (state && (state.status.status === 'offline' || state.status.status === 'stopping')) {
    return { success: false, error: `Bot is already ${state.status.status}` };
  }

  console.log(`[Bot ${botId}] Removing from active bots`);
  
  updateBotStatus(botId, { status: 'stopping' });
  addLogEntry(botId, 'info', 'Stopping bot...', 'system');

  // Remove from active bots
  activeBotIds.delete(botId);
  
  // Clear bot name cache for this bot
  botNameCache.delete(botId);

  // If there are still other active bots, restart the process without this bot
  // Otherwise, stop the process entirely
  if (activeBotIds.size > 0) {
    console.log(`[Mindcraft] Restarting process without bot ${botId}`);
    await startOrRestartMindcraftProcess();
  } else {
    console.log('[Mindcraft] No more active bots, stopping process');
    await stopMindcraftProcess();
  }

  updateBotStatus(botId, { status: 'offline' });
  addLogEntry(botId, 'info', 'Bot stopped', 'system');

  // 结束日志会话
  await logStorage.endLogSession(botId).catch(err => {
    console.error(`[LogStorage] Failed to end log session: ${err}`);
  });

  // Clean up bot state after a delay
  setTimeout(() => {
    if (!activeBotIds.has(botId)) {
      // Keep logs for a while but mark as offline
    }
  }, 30000);

  return { success: true };
}

/**
 * Checks if a bot is running
 */
export function isBotRunning(botId: string): boolean {
  if (!activeBotIds.has(botId)) return false;
  const state = botStates.get(botId);
  if (!state) return false;
  return state.status.status === 'online' || state.status.status === 'starting';
}

/**
 * Gets the count of running bots
 */
export function getRunningBotCount(): number {
  let count = 0;
  activeBotIds.forEach(botId => {
    const state = botStates.get(botId);
    if (state && (state.status.status === 'online' || state.status.status === 'starting')) {
      count++;
    }
  });
  return count;
}

/**
 * Stops all running bots
 */
export async function stopAllBots(): Promise<void> {
  console.log('[Mindcraft] Stopping all bots...');
  
  // Update all bots to stopping
  for (const botId of activeBotIds) {
    updateBotStatus(botId, { status: 'stopping' });
  }
  
  // Stop the process
  await stopMindcraftProcess();
  
  // Update all bots to offline
  for (const botId of activeBotIds) {
    updateBotStatus(botId, { status: 'offline' });
    addLogEntry(botId, 'info', 'Bot stopped', 'system');
  }
  
  activeBotIds.clear();
  botNameCache.clear();
}

export { MINDCRAFT_PATH, stripAnsiCodes, parseLogLevel };
