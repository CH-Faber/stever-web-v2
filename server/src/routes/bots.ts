import { Router, Request, Response } from 'express';
import {
  getAllBotProfiles,
  getBotProfileById,
  createBotProfile,
  updateBotProfile,
  deleteBotProfile,
  validateBotProfile,
} from '../services/botProfileService.js';
import {
  startBot,
  stopBot,
  getBotStatus,
  validateBotStartPrerequisites,
} from '../services/processManagerService.js';
import {
  BotProfile,
  CreateBotRequest,
  UpdateBotRequest,
  BotResponse,
  BotsListResponse,
  ErrorResponse,
  BotStartRequest,
  BotStatusResponse,
} from '../../../shared/types/index.js';

const router = Router();

/**
 * GET /api/bots - Get all bot profiles
 */
router.get('/', async (_req: Request, res: Response<BotsListResponse | ErrorResponse>) => {
  try {
    const bots = await getAllBotProfiles();
    res.json({ bots });
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch bot profiles',
      },
    });
  }
});

/**
 * GET /api/bots/:id - Get a single bot profile
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response<BotResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const bot = await getBotProfileById(id);
    
    if (!bot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }
    
    res.json({ bot });
  } catch (error) {
    console.error('Error fetching bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch bot profile',
      },
    });
  }
});


/**
 * POST /api/bots - Create a new bot profile
 */
router.post('/', async (req: Request<{}, {}, CreateBotRequest>, res: Response<BotResponse | ErrorResponse>) => {
  try {
    const data = req.body;
    
    // Validate the request
    const validation = validateBotProfile(data as Partial<BotProfile>);
    
    if (!validation.valid) {
      const details: Record<string, string> = {};
      validation.errors.forEach(err => {
        details[err.field] = err.message;
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bot profile configuration',
          details,
        },
      });
    }
    
    const bot = await createBotProfile({
      name: data.name,
      model: data.model,
      codeModel: data.codeModel,
      visionModel: data.visionModel,
      embedding: data.embedding,
      speakModel: data.speakModel,
      conversing: data.conversing || '',
      coding: data.coding || '',
      saving_memory: data.saving_memory || '',
      modes: {
        self_preservation: data.modes?.self_preservation ?? true,
        unstuck: data.modes?.unstuck ?? true,
        cowardice: data.modes?.cowardice ?? false,
        self_defense: data.modes?.self_defense ?? true,
        hunting: data.modes?.hunting ?? true,
        item_collecting: data.modes?.item_collecting ?? true,
        torch_placing: data.modes?.torch_placing ?? true,
        idle_staring: data.modes?.idle_staring ?? true,
        cheat: data.modes?.cheat ?? false,
      },
    });
    
    res.status(201).json({ bot });
  } catch (error) {
    console.error('Error creating bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create bot profile',
      },
    });
  }
});

/**
 * PUT /api/bots/:id - Update an existing bot profile
 */
router.put('/:id', async (req: Request<{ id: string }, {}, UpdateBotRequest>, res: Response<BotResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Check if bot exists
    const existingBot = await getBotProfileById(id);
    if (!existingBot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }
    
    // Build merged profile with proper types for validation
    const mergedProfile: Partial<BotProfile> = {
      ...existingBot,
      ...data,
      // Merge modes properly - ensure all boolean fields are defined
      modes: data.modes ? {
        ...existingBot.modes,
        ...data.modes,
      } : existingBot.modes,
    };
    
    const validation = validateBotProfile(mergedProfile);
    
    if (!validation.valid) {
      const details: Record<string, string> = {};
      validation.errors.forEach(err => {
        details[err.field] = err.message;
      });
      
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bot profile configuration',
          details,
        },
      });
    }
    
    // Build update data with properly merged modes
    const updateData: Partial<BotProfile> = {
      ...data,
      modes: data.modes ? {
        ...existingBot.modes,
        ...data.modes,
      } : undefined,
    };
    
    const bot = await updateBotProfile(id, updateData);
    
    if (!bot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }
    
    res.json({ bot });
  } catch (error) {
    console.error('Error updating bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update bot profile',
      },
    });
  }
});


/**
 * DELETE /api/bots/:id - Delete a bot profile
 */
router.delete('/:id', async (req: Request<{ id: string }>, res: Response<{ success: boolean } | ErrorResponse>) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteBotProfile(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete bot profile',
      },
    });
  }
});

/**
 * POST /api/bots/:id/start - Start a bot
 */
router.post('/:id/start', async (req: Request<{ id: string }, {}, BotStartRequest>, res: Response<BotStatusResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const { taskId } = req.body;

    // Check if bot profile exists
    const bot = await getBotProfileById(id);
    if (!bot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }

    // Validate prerequisites (API keys)
    const validation = await validateBotStartPrerequisites(id);
    if (!validation.valid) {
      return res.status(400).json({
        error: {
          code: 'MISSING_API_KEYS',
          message: `Missing required API keys: ${validation.missingKeys.join(', ')}`,
          details: { missingKeys: validation.missingKeys.join(', ') },
        },
      });
    }

    // Start the bot
    const result = await startBot(id, taskId);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'START_FAILED',
          message: result.error || 'Failed to start bot',
        },
      });
    }

    const status = getBotStatus(id);
    res.json({ botId: id, status });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to start bot',
      },
    });
  }
});

/**
 * POST /api/bots/:id/stop - Stop a running bot
 */
router.post('/:id/stop', async (req: Request<{ id: string }>, res: Response<BotStatusResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;

    // Check if bot profile exists
    const bot = await getBotProfileById(id);
    if (!bot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }

    // Stop the bot
    const result = await stopBot(id);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'STOP_FAILED',
          message: result.error || 'Failed to stop bot',
        },
      });
    }

    const status = getBotStatus(id);
    res.json({ botId: id, status });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to stop bot',
      },
    });
  }
});

/**
 * GET /api/bots/:id/status - Get bot status
 */
router.get('/:id/status', async (req: Request<{ id: string }>, res: Response<BotStatusResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;

    // Check if bot profile exists
    const bot = await getBotProfileById(id);
    if (!bot) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Bot profile with id '${id}' not found`,
        },
      });
    }

    const status = getBotStatus(id);
    res.json({ botId: id, status });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get bot status',
      },
    });
  }
});

export default router;
