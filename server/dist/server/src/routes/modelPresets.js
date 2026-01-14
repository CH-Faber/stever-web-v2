import { Router } from 'express';
import { modelPresetService } from '../services/modelPresetService.js';
const router = Router();
/**
 * GET /api/model-presets
 * 获取所有模型预设
 */
router.get('/', (_req, res) => {
    try {
        const presets = modelPresetService.getAll();
        res.json({ presets });
    }
    catch (error) {
        console.error('Error fetching model presets:', error);
        res.status(500).json({
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch model presets',
            },
        });
    }
});
/**
 * GET /api/model-presets/:id
 * 获取单个模型预设
 */
router.get('/:id', (req, res) => {
    try {
        const preset = modelPresetService.getById(req.params.id);
        if (!preset) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Model preset not found',
                },
            });
        }
        res.json({ preset });
    }
    catch (error) {
        console.error('Error fetching model preset:', error);
        res.status(500).json({
            error: {
                code: 'FETCH_ERROR',
                message: 'Failed to fetch model preset',
            },
        });
    }
});
/**
 * POST /api/model-presets
 * 创建模型预设
 */
router.post('/', (req, res) => {
    try {
        const data = req.body;
        // Validate required fields
        if (!data.name || !data.purpose || !data.config) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Name, purpose, and config are required',
                },
            });
        }
        if (!data.config.api || !data.config.model) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Config must include api and model',
                },
            });
        }
        const preset = modelPresetService.create(data);
        res.status(201).json({ preset });
    }
    catch (error) {
        console.error('Error creating model preset:', error);
        res.status(500).json({
            error: {
                code: 'CREATE_ERROR',
                message: 'Failed to create model preset',
            },
        });
    }
});
/**
 * PUT /api/model-presets/:id
 * 更新模型预设
 */
router.put('/:id', (req, res) => {
    try {
        const data = req.body;
        const preset = modelPresetService.update(req.params.id, data);
        res.json({ preset });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Model preset not found') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Model preset not found',
                },
            });
        }
        console.error('Error updating model preset:', error);
        res.status(500).json({
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to update model preset',
            },
        });
    }
});
/**
 * DELETE /api/model-presets/:id
 * 删除模型预设
 */
router.delete('/:id', (req, res) => {
    try {
        modelPresetService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Model preset not found') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Model preset not found',
                },
            });
        }
        console.error('Error deleting model preset:', error);
        res.status(500).json({
            error: {
                code: 'DELETE_ERROR',
                message: 'Failed to delete model preset',
            },
        });
    }
});
/**
 * POST /api/model-presets/:id/set-default
 * 设置为默认预设
 */
router.post('/:id/set-default', (req, res) => {
    try {
        const preset = modelPresetService.setDefault(req.params.id);
        res.json({ preset });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Model preset not found') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    message: 'Model preset not found',
                },
            });
        }
        console.error('Error setting default preset:', error);
        res.status(500).json({
            error: {
                code: 'UPDATE_ERROR',
                message: 'Failed to set default preset',
            },
        });
    }
});
export default router;
