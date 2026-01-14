import { ModelInfo, CustomEndpoint } from '../../../shared/types/index.js';
/**
 * Fetch models for a specific provider
 * Uses cache if available and not expired
 */
export declare function fetchModels(provider: string): Promise<ModelInfo[]>;
/**
 * Fetch models from a custom endpoint
 */
export declare function fetchModelsFromEndpoint(endpoint: CustomEndpoint): Promise<ModelInfo[]>;
/**
 * Clear cache for a specific provider or endpoint
 */
export declare function clearCache(provider?: string, endpointId?: string): void;
/**
 * Check if models are cached for a provider
 */
export declare function isCached(provider: string, endpointId?: string): boolean;
/**
 * Get all supported providers
 */
export declare function getSupportedProviders(): string[];
