import { Router, Request, Response } from 'express';
import {
  getAPIKeyStatuses,
  updateAPIKey,
  deleteAPIKey,
  isValidProvider,
} from '../services/apiKeyService.js';
import {
  KeysStatusResponse,
  UpdateKeyRequest,
  ErrorResponse,
} from '../../../shared/types/index.js';

const router = Router();

/**
 * GET /api/keys - Get all API key statuses (not actual keys)
 */
router.get('/', async (_req: Request, res: Response<KeysStatusResponse | ErrorResponse>) => {
  try {
    const keys = await getAPIKeyStatuses();
    res.json({ keys });
  } catch (error) {
    console.error('Error fetching key statuses:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch API key statuses',
      },
    });
  }
});

/**
 * PUT /api/keys/:provider - Update an API key for a provider
 */
router.put('/:provider', async (
  req: Request<{ provider: string }, {}, UpdateKeyRequest>,
  res: Response<{ success: boolean } | ErrorResponse>
) => {
  try {
    const { provider } = req.params;
    const { key } = req.body;

    // Validate provider
    if (!isValidProvider(provider)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PROVIDER',
          message: `Invalid provider: '${provider}'`,
        },
      });
    }

    // Validate key
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'API key is required',
          details: { key: 'API key must be a non-empty string' },
        },
      });
    }

    const success = await updateAPIKey(provider, key);

    if (!success) {
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update API key',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update API key',
      },
    });
  }
});

/**
 * DELETE /api/keys/:provider - Delete an API key for a provider
 */
router.delete('/:provider', async (
  req: Request<{ provider: string }>,
  res: Response<{ success: boolean } | ErrorResponse>
) => {
  try {
    const { provider } = req.params;

    // Validate provider
    if (!isValidProvider(provider)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PROVIDER',
          message: `Invalid provider: '${provider}'`,
        },
      });
    }

    const deleted = await deleteAPIKey(provider);

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `API key for provider '${provider}' not found`,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete API key',
      },
    });
  }
});

export default router;
