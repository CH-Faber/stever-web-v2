import { CustomEndpoint } from '../../../shared/types/index.js';
declare const ENDPOINTS_FILE: string;
/**
 * Reads all custom endpoints
 */
export declare function getAllEndpoints(): Promise<CustomEndpoint[]>;
/**
 * Gets a single endpoint by ID
 */
export declare function getEndpointById(id: string): Promise<CustomEndpoint | null>;
/**
 * Creates a new custom endpoint
 */
export declare function createEndpoint(data: Omit<CustomEndpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomEndpoint>;
/**
 * Updates an existing endpoint
 */
export declare function updateEndpoint(id: string, updates: Partial<Omit<CustomEndpoint, 'id' | 'createdAt'>>): Promise<CustomEndpoint | null>;
/**
 * Deletes an endpoint
 */
export declare function deleteEndpoint(id: string): Promise<boolean>;
export { ENDPOINTS_FILE };
