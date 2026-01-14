import { Router } from 'express';
import { fetchModels, fetchModelsFromEndpoint, getSupportedProviders, isCached, } from '../services/modelFetchService.js';
const router = Router();
/**
 * GET /api/models/providers - Get list of supported providers
 */
router.get('/providers', (_req, res) => {
    try {
        const providers = getSupportedProviders();
        res.json({ providers });
    }
    catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch providers list',
            },
        });
    }
});
/**
 * GET /api/models/:provider - Get models for a specific provider
 */
router.get('/:provider', async (req, res) => {
    try {
        const { provider } = req.params;
        // Validate provider
        const supportedProviders = getSupportedProviders();
        if (!supportedProviders.includes(provider)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_PROVIDER',
                    message: `Invalid provider: '${provider}'. Supported providers: ${supportedProviders.join(', ')}`,
                },
            });
        }
        // Check if cached
        const cached = isCached(provider);
        // Fetch models
        const models = await fetchModels(provider);
        res.json({
            models,
            provider,
            cached,
        });
    }
    catch (error) {
        console.error(`Error fetching models for provider:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Determine appropriate error code based on error message
        let statusCode = 500;
        let errorCode = 'INTERNAL_ERROR';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            statusCode = 401;
            errorCode = 'UNAUTHORIZED';
        }
        else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            statusCode = 403;
            errorCode = 'FORBIDDEN';
        }
        else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
            statusCode = 404;
            errorCode = 'NOT_FOUND';
        }
        res.status(statusCode).json({
            error: {
                code: errorCode,
                message: `Failed to fetch models: ${errorMessage}`,
            },
        });
    }
});
/**
 * POST /api/models/custom - Fetch models from a custom endpoint
 */
router.post('/custom', async (req, res) => {
    try {
        const { id, name, baseUrl, apiKey, headers, apiFormat } = req.body;
        // Validate required fields
        if (!id || !name || !baseUrl || !apiFormat) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields: id, name, baseUrl, and apiFormat are required',
                    details: {
                        id: !id ? 'id is required' : '',
                        name: !name ? 'name is required' : '',
                        baseUrl: !baseUrl ? 'baseUrl is required' : '',
                        apiFormat: !apiFormat ? 'apiFormat is required' : '',
                    },
                },
            });
        }
        // Validate URL format
        try {
            new URL(baseUrl);
        }
        catch {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid baseUrl format',
                    details: { baseUrl: 'Must be a valid URL' },
                },
            });
        }
        // Validate apiFormat
        const validFormats = ['openai', 'anthropic', 'custom'];
        if (!validFormats.includes(apiFormat)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: `Invalid apiFormat: '${apiFormat}'. Must be one of: ${validFormats.join(', ')}`,
                },
            });
        }
        // Create endpoint object
        const endpoint = {
            id,
            name,
            baseUrl,
            apiKey,
            headers,
            apiFormat,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Check if cached
        const cached = isCached('custom', id);
        // Fetch models from custom endpoint
        const models = await fetchModelsFromEndpoint(endpoint);
        res.json({
            models,
            provider: 'custom',
            cached,
        });
    }
    catch (error) {
        console.error('Error fetching models from custom endpoint:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Determine appropriate error code
        let statusCode = 500;
        let errorCode = 'INTERNAL_ERROR';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            statusCode = 401;
            errorCode = 'UNAUTHORIZED';
        }
        else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            statusCode = 403;
            errorCode = 'FORBIDDEN';
        }
        else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
            statusCode = 404;
            errorCode = 'ENDPOINT_NOT_FOUND';
        }
        else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
            statusCode = 503;
            errorCode = 'CONNECTION_ERROR';
        }
        res.status(statusCode).json({
            error: {
                code: errorCode,
                message: `Failed to fetch models from custom endpoint: ${errorMessage}`,
            },
        });
    }
});
export default router;
