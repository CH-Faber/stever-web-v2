import { Task, ValidationResult } from '../../../shared/types/index.js';
declare const TASKS_DIR: string;
declare const DEFAULT_TASK_VALUES: {
    agentCount: number;
    initialInventory: {};
    blockedActions: {};
    type: "techtree";
};
/**
 * Validates a task configuration
 */
export declare function validateTask(task: Partial<Task>): ValidationResult;
/**
 * Reads all tasks from the tasks directory
 */
export declare function getAllTasks(): Promise<Task[]>;
/**
 * Gets a single task by ID
 */
export declare function getTaskById(id: string): Promise<Task | null>;
/**
 * Creates a new task
 */
export declare function createTask(data: Omit<Task, 'id'>): Promise<Task>;
/**
 * Deletes a task
 */
export declare function deleteTask(id: string): Promise<boolean>;
/**
 * Checks if a task exists
 */
export declare function taskExists(id: string): Promise<boolean>;
export { TASKS_DIR, DEFAULT_TASK_VALUES };
