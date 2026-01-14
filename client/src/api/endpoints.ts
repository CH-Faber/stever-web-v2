import { api } from './client';
import type { CustomEndpoint, ApiFormat } from '../../../shared/types';

export interface EndpointsListResponse {
  endpoints: CustomEndpoint[];
}

export interface EndpointResponse {
  endpoint: CustomEndpoint;
}

export interface CreateEndpointRequest {
  name: string;
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  apiFormat: ApiFormat;
}

export interface UpdateEndpointRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  apiFormat?: ApiFormat;
}

export const endpointsApi = {
  /**
   * Get all custom endpoints
   */
  async getAll(): Promise<CustomEndpoint[]> {
    const response = await api.get<EndpointsListResponse>('/api/endpoints');
    return response.endpoints;
  },

  /**
   * Get a single endpoint by ID
   */
  async getById(id: string): Promise<CustomEndpoint> {
    const response = await api.get<EndpointResponse>(`/api/endpoints/${id}`);
    return response.endpoint;
  },

  /**
   * Create a new endpoint
   */
  async create(data: CreateEndpointRequest): Promise<CustomEndpoint> {
    const response = await api.post<EndpointResponse>('/api/endpoints', data);
    return response.endpoint;
  },

  /**
   * Update an existing endpoint
   */
  async update(id: string, data: UpdateEndpointRequest): Promise<CustomEndpoint> {
    const response = await api.put<EndpointResponse>(`/api/endpoints/${id}`, data);
    return response.endpoint;
  },

  /**
   * Delete an endpoint
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/endpoints/${id}`);
  },
};
