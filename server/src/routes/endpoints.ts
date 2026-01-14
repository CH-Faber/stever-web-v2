import { Router, Request, Response } from 'express';
import {
  getAllEndpoints,
  getEndpointById,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
} from '../services/endpointService.js';
import type { CustomEndpoint } from '../../../shared/types/index.js';

const router = Router();

// GET /api/endpoints - Get all endpoints
router.get('/', async (_req: Request, res: Response) => {
  try {
    const endpoints = await getAllEndpoints();
    // Don't expose API keys in list response
    const safeEndpoints = endpoints.map(ep => ({
      ...ep,
      apiKey: ep.apiKey ? '********' : undefined,
    }));
    res.json({ endpoints: safeEndpoints });
  } catch (error) {
    console.error('Error getting endpoints:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get endpoints' },
    });
  }
});

// GET /api/endpoints/:id - Get single endpoint
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const endpoint = await getEndpointById(req.params.id);
    if (!endpoint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
      });
    }
    // Don't expose API key
    const safeEndpoint = {
      ...endpoint,
      apiKey: endpoint.apiKey ? '********' : undefined,
    };
    res.json({ endpoint: safeEndpoint });
  } catch (error) {
    console.error('Error getting endpoint:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get endpoint' },
    });
  }
});

// POST /api/endpoints - Create new endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, baseUrl, apiKey, headers, apiFormat } = req.body;
    
    if (!name || !baseUrl || !apiFormat) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'name, baseUrl, and apiFormat are required' },
      });
    }
    
    const endpoint = await createEndpoint({
      name,
      baseUrl,
      apiKey,
      headers,
      apiFormat,
    });
    
    res.status(201).json({ endpoint });
  } catch (error) {
    console.error('Error creating endpoint:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create endpoint' },
    });
  }
});

// PUT /api/endpoints/:id - Update endpoint
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, baseUrl, apiKey, headers, apiFormat } = req.body;
    
    const endpoint = await updateEndpoint(req.params.id, {
      ...(name && { name }),
      ...(baseUrl && { baseUrl }),
      ...(apiKey !== undefined && { apiKey }),
      ...(headers && { headers }),
      ...(apiFormat && { apiFormat }),
    });
    
    if (!endpoint) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
      });
    }
    
    res.json({ endpoint });
  } catch (error) {
    console.error('Error updating endpoint:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update endpoint' },
    });
  }
});

// DELETE /api/endpoints/:id - Delete endpoint
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteEndpoint(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
      });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting endpoint:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete endpoint' },
    });
  }
});

export default router;
