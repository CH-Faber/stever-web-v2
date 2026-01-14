import { Router, Request, Response } from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  deleteTask,
  validateTask,
} from '../services/taskService.js';
import {
  Task,
  CreateTaskRequest,
  TaskResponse,
  TasksListResponse,
  ErrorResponse,
} from '../../../shared/types/index.js';

const router = Router();

/**
 * GET /api/tasks - Get all tasks
 */
router.get('/', async (_req: Request, res: Response<TasksListResponse | ErrorResponse>) => {
  try {
    const tasks = await getAllTasks();
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch tasks',
      },
    });
  }
});

/**
 * GET /api/tasks/:id - Get a single task
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response<TaskResponse | ErrorResponse>) => {
  try {
    const { id } = req.params;
    const task = await getTaskById(id);

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Task with id '${id}' not found`,
        },
      });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch task',
      },
    });
  }
});


/**
 * POST /api/tasks - Create a new task
 */
router.post('/', async (req: Request<{}, {}, CreateTaskRequest>, res: Response<TaskResponse | ErrorResponse>) => {
  try {
    const data = req.body;

    // Validate the request
    const validation = validateTask(data as Partial<Task>);

    if (!validation.valid) {
      const details: Record<string, string> = {};
      validation.errors.forEach(err => {
        details[err.field] = err.message;
      });

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid task configuration',
          details,
        },
      });
    }

    const task = await createTask({
      name: data.name,
      goal: data.goal,
      target: data.target,
      numberOfTarget: data.numberOfTarget,
      timeout: data.timeout,
      agentCount: data.agentCount ?? 1,
      initialInventory: data.initialInventory ?? {},
      blockedActions: data.blockedActions ?? {},
      type: data.type ?? 'techtree',
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create task',
      },
    });
  }
});

/**
 * DELETE /api/tasks/:id - Delete a task
 */
router.delete('/:id', async (req: Request<{ id: string }>, res: Response<{ success: boolean } | ErrorResponse>) => {
  try {
    const { id } = req.params;

    const deleted = await deleteTask(id);

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Task with id '${id}' not found`,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete task',
      },
    });
  }
});

export default router;
