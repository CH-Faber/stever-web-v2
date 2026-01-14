import { LLM_PROVIDER_INFO } from '../../../shared/types/index.js';
import { getAPIKeyByProvider } from './apiKeyService.js';
// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;
// Model list cache
const modelCache = new Map();
/**
 * Provider base URLs for model list API
 */
const PROVIDER_BASE_URLS = {
    openai: 'https://api.openai.com',
    groq: 'https://api.groq.com/openai',
    deepseek: 'https://api.deepseek.com',
    mistral: 'https://api.mistral.ai',
    openrouter: 'https://openrouter.ai/api',
    novita: 'https://api.novita.ai',
    hyperbolic: 'https://api.hyperbolic.xyz',
    cerebras: 'https://api.cerebras.ai',
};
/**
 * Infer model capabilities from model ID
 */
function inferCapabilities(modelId) {
    const capabilities = ['text'];
    const lowerModelId = modelId.toLowerCase();
    // Code capabilities
    if (lowerModelId.includes('code') ||
        lowerModelId.includes('codex') ||
        lowerModelId.includes('starcoder') ||
        lowerModelId.includes('deepseek-coder')) {
        capabilities.push('code');
    }
    // Vision capabilities
    if (lowerModelId.includes('vision') ||
        lowerModelId.includes('gpt-4o') ||
        lowerModelId.includes('gpt-4-turbo') ||
        lowerModelId.includes('claude-3')) {
        capabilities.push('vision');
    }
    // Embedding capabilities
    if (lowerModelId.includes('embed') ||
        lowerModelId.includes('embedding')) {
        return ['embedding']; // Embedding models typically only do embedding
    }
    // Function calling (most modern models support this)
    if (lowerModelId.includes('gpt-4') ||
        lowerModelId.includes('gpt-3.5-turbo') ||
        lowerModelId.includes('claude-3') ||
        lowerModelId.includes('mistral')) {
        capabilities.push('function_calling');
    }
    return capabilities;
}
/**
 * Parse OpenAI-compatible model list response
 */
function parseOpenAIModels(response, provider) {
    if (!response.data || !Array.isArray(response.data)) {
        return [];
    }
    return response.data.map(model => ({
        id: model.id,
        name: model.id,
        provider,
        capabilities: inferCapabilities(model.id),
        description: `Owned by: ${model.owned_by}`,
    }));
}
/**
 * Get cache key for a provider or endpoint
 */
function getCacheKey(provider, endpointId) {
    return endpointId ? `endpoint:${endpointId}` : `provider:${provider}`;
}
/**
 * Check if cache entry is valid
 */
function isCacheValid(entry) {
    if (!entry)
        return false;
    return new Date() < entry.expiry;
}
/**
 * Fetch models from an OpenAI-compatible API endpoint
 */
async function fetchOpenAICompatibleModels(baseUrl, apiKey, provider, headers) {
    const url = `${baseUrl.replace(/\/$/, '')}/v1/models`;
    const requestHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...headers,
    };
    const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    return parseOpenAIModels(data, provider);
}
/**
 * Get predefined models for providers without model list API
 */
function getPredefinedModels(provider) {
    const predefinedModels = {
        anthropic: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', capabilities: ['text', 'code', 'function_calling'] },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'anthropic', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', capabilities: ['text', 'code', 'vision', 'function_calling'] },
        ],
        google: [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', provider: 'google', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', provider: 'google', capabilities: ['text', 'code', 'function_calling'] },
        ],
        xai: [
            { id: 'grok-2-latest', name: 'Grok 2', provider: 'xai', capabilities: ['text', 'code', 'function_calling'] },
            { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', provider: 'xai', capabilities: ['text', 'code', 'vision', 'function_calling'] },
            { id: 'grok-beta', name: 'Grok Beta', provider: 'xai', capabilities: ['text', 'code', 'function_calling'] },
        ],
        qwen: [
            { id: 'qwen-turbo', name: 'Qwen Turbo', provider: 'qwen', capabilities: ['text', 'code', 'function_calling'] },
            { id: 'qwen-plus', name: 'Qwen Plus', provider: 'qwen', capabilities: ['text', 'code', 'function_calling'] },
            { id: 'qwen-max', name: 'Qwen Max', provider: 'qwen', capabilities: ['text', 'code', 'function_calling'] },
            { id: 'qwen-vl-plus', name: 'Qwen VL Plus', provider: 'qwen', capabilities: ['text', 'vision'] },
        ],
        replicate: [
            { id: 'meta/llama-2-70b-chat', name: 'Llama 2 70B Chat', provider: 'replicate', capabilities: ['text', 'code'] },
            { id: 'meta/llama-2-13b-chat', name: 'Llama 2 13B Chat', provider: 'replicate', capabilities: ['text', 'code'] },
            { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', provider: 'replicate', capabilities: ['text', 'code'] },
        ],
        huggingface: [
            { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', provider: 'huggingface', capabilities: ['text', 'code'] },
            { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', provider: 'huggingface', capabilities: ['text', 'code'] },
            { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B', provider: 'huggingface', capabilities: ['text', 'code'] },
        ],
        glhf: [
            { id: 'hf:meta-llama/Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B', provider: 'glhf', capabilities: ['text', 'code'] },
            { id: 'hf:meta-llama/Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', provider: 'glhf', capabilities: ['text', 'code'] },
        ],
        mercury: [
            { id: 'mercury-coder-small', name: 'Mercury Coder Small', provider: 'mercury', capabilities: ['text', 'code'] },
        ],
    };
    return predefinedModels[provider] || [];
}
/**
 * Fetch models for a specific provider
 * Uses cache if available and not expired
 */
export async function fetchModels(provider) {
    const cacheKey = getCacheKey(provider);
    const cached = modelCache.get(cacheKey);
    // Return cached data if valid
    if (isCacheValid(cached)) {
        return cached.models;
    }
    // Check if provider is valid
    const providerInfo = LLM_PROVIDER_INFO.find(p => p.id === provider);
    if (!providerInfo) {
        throw new Error(`Unknown provider: ${provider}`);
    }
    // Get API key for the provider
    const apiKey = await getAPIKeyByProvider(provider);
    // Check if provider has a model list API
    const baseUrl = PROVIDER_BASE_URLS[provider];
    let models;
    if (baseUrl && apiKey) {
        // Fetch from API
        try {
            models = await fetchOpenAICompatibleModels(baseUrl, apiKey, provider);
        }
        catch (error) {
            console.error(`Failed to fetch models from ${provider}:`, error);
            // Fall back to predefined models
            models = getPredefinedModels(provider);
        }
    }
    else {
        // Use predefined models
        models = getPredefinedModels(provider);
    }
    // Cache the results
    modelCache.set(cacheKey, {
        models,
        expiry: new Date(Date.now() + CACHE_DURATION_MS),
    });
    return models;
}
/**
 * Fetch models from a custom endpoint
 */
export async function fetchModelsFromEndpoint(endpoint) {
    const cacheKey = getCacheKey('custom', endpoint.id);
    const cached = modelCache.get(cacheKey);
    // Return cached data if valid
    if (isCacheValid(cached)) {
        return cached.models;
    }
    let models;
    if (endpoint.apiFormat === 'openai' || endpoint.apiFormat === 'custom') {
        // Use OpenAI-compatible format
        models = await fetchOpenAICompatibleModels(endpoint.baseUrl, endpoint.apiKey || '', 'custom', endpoint.headers);
    }
    else if (endpoint.apiFormat === 'anthropic') {
        // Anthropic doesn't have a model list API, return predefined
        models = getPredefinedModels('anthropic').map(m => ({
            ...m,
            provider: 'custom',
        }));
    }
    else {
        models = [];
    }
    // Cache the results
    modelCache.set(cacheKey, {
        models,
        expiry: new Date(Date.now() + CACHE_DURATION_MS),
    });
    return models;
}
/**
 * Clear cache for a specific provider or endpoint
 */
export function clearCache(provider, endpointId) {
    if (provider || endpointId) {
        const cacheKey = getCacheKey(provider || 'custom', endpointId);
        modelCache.delete(cacheKey);
    }
    else {
        modelCache.clear();
    }
}
/**
 * Check if models are cached for a provider
 */
export function isCached(provider, endpointId) {
    const cacheKey = getCacheKey(provider, endpointId);
    return isCacheValid(modelCache.get(cacheKey));
}
/**
 * Get all supported providers
 */
export function getSupportedProviders() {
    return LLM_PROVIDER_INFO.map(p => p.id);
}
