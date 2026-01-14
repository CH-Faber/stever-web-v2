import { ExportResponse, ImportRequest, ValidationResult } from '../../../shared/types/index.js';
/**
 * Exports all configuration data (bots, settings, tasks) as a single JSON object
 */
export declare function exportAllConfig(): Promise<ExportResponse>;
/**
 * Validates the structure of an import request
 */
export declare function validateImportData(data: unknown): ValidationResult;
/**
 * Imports configuration data (bots, settings, tasks)
 * Returns the count of imported items
 */
export declare function importConfig(data: ImportRequest): Promise<{
    bots: number;
    settings: boolean;
    tasks: number;
}>;
/**
 * Validates JSON string and parses it
 */
export declare function parseImportJson(jsonString: string): {
    data: ImportRequest | null;
    error: string | null;
};
