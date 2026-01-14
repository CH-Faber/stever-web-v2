import { promises as fs } from 'fs';
import path from 'path';
import { Task, ValidationResult, ValidationError } from '../../../shared/types/index.js';

// Default tasks directory - can be configured via environment variable
const TASKS_DIR = process.env.TASKS_DIR || path.join(process.cwd(), '..', 'tasks');

// Default task values
const DEFAULT_TASK_VALUES = {
  agentCount: 1,
  initialInventory: {},
  blockedActions: {},
  type: 'techtree' as const,
};

/**
 * Ensures the tasks directory exists
 */
async function ensureTasksDir(): Promise<void> {
  try {
    await fs.access(TASKS_DIR);
  } catch {
    await fs.mkdir(TASKS_DIR, { recursive: true });
  }
}

/**
 * Generates a unique ID for a new task
 */
function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gets the file path for a task
 */
function getTaskPath(id: string): string {
  return path.join(TASKS_DIR, `${id}.json`);
}

/**
 * Validates a task configuration
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!task.name || typeof task.name !== 'string' || task.name.trim() === '') {
    errors.push({ field: 'name', message: 'Task name is required' });
  }

  if (!task.goal || typeof task.goal !== 'string' || task.goal.trim() === '') {
    errors.push({ field: 'goal', message: 'Task goal is required' });
  }

  if (!task.target || typeof task.target !== 'string' || task.target.trim() === '') {
    errors.push({ field: 'target', message: 'Target item is required' });
  }


  // Validate numberOfTarget
  if (task.numberOfTarget === undefined || task.numberOfTarget === null) {
    errors.push({ field: 'numberOfTarget', message: 'Number of target is required' });
  } else if (typeof task.numberOfTarget !== 'number' || !Number.isInteger(task.numberOfTarget)) {
    errors.push({ field: 'numberOfTarget', message: 'Number of target must be an integer' });
  } else if (task.numberOfTarget < 1) {
    errors.push({ field: 'numberOfTarget', message: 'Number of target must be at least 1' });
  }

  // Validate timeout
  if (task.timeout === undefined || task.timeout === null) {
    errors.push({ field: 'timeout', message: 'Timeout is required' });
  } else if (typeof task.timeout !== 'number' || !Number.isInteger(task.timeout)) {
    errors.push({ field: 'timeout', message: 'Timeout must be an integer' });
  } else if (task.timeout < 1) {
    errors.push({ field: 'timeout', message: 'Timeout must be at least 1 second' });
  }

  // Validate optional agentCount
  if (task.agentCount !== undefined) {
    if (typeof task.agentCount !== 'number' || !Number.isInteger(task.agentCount)) {
      errors.push({ field: 'agentCount', message: 'Agent count must be an integer' });
    } else if (task.agentCount < 1) {
      errors.push({ field: 'agentCount', message: 'Agent count must be at least 1' });
    }
  }

  // Validate optional type
  if (task.type !== undefined) {
    if (task.type !== 'techtree' && task.type !== 'construction') {
      errors.push({ field: 'type', message: "Task type must be 'techtree' or 'construction'" });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Reads all tasks from the tasks directory
 */
export async function getAllTasks(): Promise<Task[]> {
  await ensureTasksDir();

  const files = await fs.readdir(TASKS_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const tasks: Task[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(TASKS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const task = JSON.parse(content) as Task;

      // Ensure the task has an id (use filename without extension if not)
      if (!task.id) {
        task.id = path.basename(file, '.json');
      }

      tasks.push(task);
    } catch (error) {
      console.error(`Error reading task ${file}:`, error);
      // Skip invalid files
    }
  }

  return tasks;
}


/**
 * Gets a single task by ID
 */
export async function getTaskById(id: string): Promise<Task | null> {
  await ensureTasksDir();

  const filePath = getTaskPath(id);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const task = JSON.parse(content) as Task;

    // Ensure the task has the correct id
    if (!task.id) {
      task.id = id;
    }

    return task;
  } catch (error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Creates a new task
 */
export async function createTask(data: Omit<Task, 'id'>): Promise<Task> {
  await ensureTasksDir();

  const id = generateId();

  const task: Task = {
    id,
    name: data.name,
    goal: data.goal,
    target: data.target,
    numberOfTarget: data.numberOfTarget,
    timeout: data.timeout,
    agentCount: data.agentCount ?? DEFAULT_TASK_VALUES.agentCount,
    initialInventory: data.initialInventory ?? DEFAULT_TASK_VALUES.initialInventory,
    blockedActions: data.blockedActions ?? DEFAULT_TASK_VALUES.blockedActions,
    type: data.type ?? DEFAULT_TASK_VALUES.type,
  };

  const filePath = getTaskPath(id);
  await fs.writeFile(filePath, JSON.stringify(task, null, 2), 'utf-8');

  return task;
}

/**
 * Deletes a task
 */
export async function deleteTask(id: string): Promise<boolean> {
  const filePath = getTaskPath(id);

  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a task exists
 */
export async function taskExists(id: string): Promise<boolean> {
  const filePath = getTaskPath(id);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export { TASKS_DIR, DEFAULT_TASK_VALUES };
