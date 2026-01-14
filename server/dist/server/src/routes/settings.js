import { Router } from 'express';
import { getSettings, updateSettings, validateSettings, } from '../services/settingsService.js';
const router = Router();
/**
 * GET /api/settings - Get server settings
 */
router.get('/', async (_req, res) => {
    try {
        const settings = await getSettings();
        res.json({ settings });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch server settings',
            },
        });
    }
});
/**
 * PUT /api/settings - Update server settings
 */
router.put('/', async (req, res) => {
    try {
        const updates = req.body;
        // Validate the updates
        const validation = validateSettings(updates);
        if (!validation.valid) {
            const details = {};
            validation.errors.forEach(err => {
                details[err.field] = err.message;
            });
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid settings provided',
                    details,
                },
            });
        }
        // Update settings
        const settings = await updateSettings(updates);
        res.json({ settings });
    }
    catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update server settings',
            },
        });
    }
});
export default router;
