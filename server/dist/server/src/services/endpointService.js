import { promises as fs } from 'fs';
import path from 'path';
// Default endpoints file path
const ENDPOINTS_FILE = process.env.ENDPOINTS_FILE || path.join(process.cwd(), '..', 'endpoints.json');
/**
 * Ensures the endpoints file exists
 */
async function ensureEndpointsFile() {
    try {
        await fs.access(ENDPOINTS_FILE);
    }
    catch {
        const dir = path.dirname(ENDPOINTS_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(ENDPOINTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}
/**
 * Generates a unique ID for a new endpoint
 */
function generateId() {
    return `ep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Reads all custom endpoints
 */
export async function getAllEndpoints() {
    await ensureEndpointsFile();
    try {
        const content = await fs.readFile(ENDPOINTS_FILE, 'utf-8');
        const endpoints = JSON.parse(content);
        // Convert date strings back to Date objects
        return endpoints.map(ep => ({
            ...ep,
            createdAt: new Date(ep.createdAt),
            updatedAt: new Date(ep.updatedAt),
        }));
    }
    catch (error) {
        console.error('Error reading endpoints file:', error);
        return [];
    }
}
/**
 * Gets a single endpoint by ID
 */
export async function getEndpointById(id) {
    const endpoints = await getAllEndpoints();
    return endpoints.find(ep => ep.id === id) || null;
}
/**
 * Creates a new custom endpoint
 */
export async function createEndpoint(data) {
    await ensureEndpointsFile();
    const endpoints = await getAllEndpoints();
    const now = new Date();
    const newEndpoint = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    endpoints.push(newEndpoint);
    await fs.writeFile(ENDPOINTS_FILE, JSON.stringify(endpoints, null, 2), 'utf-8');
    return newEndpoint;
}
/**
 * Updates an existing endpoint
 */
export async function updateEndpoint(id, updates) {
    const endpoints = await getAllEndpoints();
    const index = endpoints.findIndex(ep => ep.id === id);
    if (index === -1) {
        return null;
    }
    endpoints[index] = {
        ...endpoints[index],
        ...updates,
        updatedAt: new Date(),
    };
    await fs.writeFile(ENDPOINTS_FILE, JSON.stringify(endpoints, null, 2), 'utf-8');
    return endpoints[index];
}
/**
 * Deletes an endpoint
 */
export async function deleteEndpoint(id) {
    const endpoints = await getAllEndpoints();
    const filtered = endpoints.filter(ep => ep.id !== id);
    if (filtered.length === endpoints.length) {
        return false;
    }
    await fs.writeFile(ENDPOINTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
}
export { ENDPOINTS_FILE };
