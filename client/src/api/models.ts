import { api } from './client';
import type {
  ModelsListResponse,
  ModelInfo,
  CustomEndpoint,
} from '../../../shared/types';

/**
 * Request body for fetching models from a custom endpoint
 */
interface FetchModelsFromEndpointRequest {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  apiFormat: 'openai' | 'anthropic' | 'custom';
}

/**
 * Response for providers list
 */
interface ProvidersListResponse {
  providers: string[];
}

export const modelsApi = {
  /**
   * Get list of supported providers
   * @returns Array of supported provider identifiers
   */
  getProviders: async (): Promise<string[]> => {
    const response = await api.get<ProvidersListResponse>('/api/models/providers');
    return response.providers;
  },

  /**
   * Fetch models for a specific provider
   * Requirement 2.1: Call the endpoint's model list API to get available models
   * Requirement 2.5: Show loading state indicator while fetching
   * 
   * @param provider - The provider identifier (e.g., 'openai', 'anthropic')
   * @returns ModelsListResponse containing models, provider, and cache status
   */
  fetchModels: async (provider: string): Promise<ModelsListResponse> => {
    return api.get<ModelsListResponse>(`/api/models/${provider}`);
  },

  /**
   * Fetch models from a custom endpoint
   * Requirement 2.1: Call the endpoint's model list API to get available models
   * Requirement 2.6: Support OpenAI-compatible format adapters
   * 
   * @param endpoint - The custom endpoint configuration
   * @returns ModelsListResponse containing models from the custom endpoint
   */
  fetchModelsFromEndpoint: async (endpoint: CustomEndpoint): Promise<ModelsListResponse> => {
    const requestBody: FetchModelsFromEndpointRequest = {
      id: endpoint.id,
      name: endpoint.name,
      baseUrl: endpoint.baseUrl,
      apiKey: endpoint.apiKey,
      headers: endpoint.headers,
      apiFormat: endpoint.apiFormat,
    };
    
    return api.post<ModelsListResponse>('/api/models/custom', requestBody);
  },

  /**
   * Helper function to extract just the model list from a provider
   * @param provider - The provider identifier
   * @returns Array of ModelInfo objects
   */
  getModelsList: async (provider: string): Promise<ModelInfo[]> => {
    const response = await modelsApi.fetchModels(provider);
    return response.models;
  },

  /**
   * Helper function to extract just the model list from a custom endpoint
   * @param endpoint - The custom endpoint configuration
   * @returns Array of ModelInfo objects
   */
  getModelsListFromEndpoint: async (endpoint: CustomEndpoint): Promise<ModelInfo[]> => {
    const response = await modelsApi.fetchModelsFromEndpoint(endpoint);
    return response.models;
  },
};
