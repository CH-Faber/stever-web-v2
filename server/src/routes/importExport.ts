import { Router, Request, Response } from 'express';
import {
  exportAllConfig,
  validateImportData,
  importConfig,
} from '../services/importExportService.js';
import {
  ExportResponse,
  ImportRequest,
  ImportResponse,
  ErrorResponse,
} from '../../../shared/types/index.js';

const router = Router();

/**
 * GET /api/export - Export all configuration
 */
router.get('/export', async (_req: Request, res: Response<ExportResponse | ErrorResponse>) => {
  try {
    const config = await exportAllConfig();
    res.json(config);
  } catch (error) {
    console.error('Error exporting configuration:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export configuration',
      },
    });
  }
});

/**
 * POST /api/import - Import configuration
 */
router.post('/import', async (req: Request<{}, {}, ImportRequest>, res: Response<ImportResponse | ErrorResponse>) => {
  try {
    const data = req.body;

    // Validate the import data
    const validation = validateImportData(data);

    if (!validation.valid) {
      const details: Record<string, string> = {};
      validation.errors.forEach(err => {
        details[err.field] = err.message;
      });

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import data format',
          details,
        },
      });
    }

    // Import the configuration
    const imported = await importConfig(data);

    res.json({ imported });
  } catch (error) {
    console.error('Error importing configuration:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to import configuration',
      },
    });
  }
});

export default router;
