import { ApiError } from '../api/client';
import { toast } from '../components/Toast';

/**
 * Error codes and their user-friendly messages
 * Validates: Requirements 7.4, 8.3
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // Network errors
  NETWORK_ERROR: {
    title: '网络错误',
    message: '无法连接到服务器，请检查网络连接',
  },
  TIMEOUT: {
    title: '请求超时',
    message: '服务器响应时间过长，请稍后重试',
  },
  
  // API errors
  MISSING_API_KEYS: {
    title: '缺少 API 密钥',
    message: '请先配置所需的 API 密钥',
  },
  INVALID_CONFIG: {
    title: '配置无效',
    message: '配置格式不正确，请检查后重试',
  },
  BOT_NOT_FOUND: {
    title: '机器人不存在',
    message: '找不到指定的机器人配置',
  },
  BOT_ALREADY_RUNNING: {
    title: '机器人已在运行',
    message: '该机器人已经在运行中',
  },
  BOT_NOT_RUNNING: {
    title: '机器人未运行',
    message: '该机器人当前未在运行',
  },
  
  // File errors
  FILE_NOT_FOUND: {
    title: '文件不存在',
    message: '找不到指定的文件',
  },
  FILE_READ_ERROR: {
    title: '读取失败',
    message: '无法读取文件内容',
  },
  FILE_WRITE_ERROR: {
    title: '写入失败',
    message: '无法保存文件',
  },
  
  // Import/Export errors
  INVALID_IMPORT_FORMAT: {
    title: '导入格式无效',
    message: '配置文件格式不正确，请检查文件内容',
  },
  IMPORT_VALIDATION_ERROR: {
    title: '导入验证失败',
    message: '配置文件包含无效数据',
  },
  
  // Validation errors
  VALIDATION_ERROR: {
    title: '验证失败',
    message: '请检查输入内容是否正确',
  },
  REQUIRED_FIELD_MISSING: {
    title: '缺少必填字段',
    message: '请填写所有必填项',
  },
  
  // Generic errors
  UNKNOWN_ERROR: {
    title: '未知错误',
    message: '发生了意外错误，请稍后重试',
  },
  SERVER_ERROR: {
    title: '服务器错误',
    message: '服务器处理请求时出错',
  },
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(code: string): { title: string; message: string } {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format error details for display
 */
export function formatErrorDetails(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details) {
      return Object.entries(error.details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}

/**
 * Handle API errors with toast notifications
 * Provides consistent error handling across the application
 */
export function handleApiError(error: unknown, context?: string): void {
  if (error instanceof ApiError) {
    const { title, message } = getErrorMessage(error.code);
    const detailMessage = error.details 
      ? formatErrorDetails(error)
      : error.message !== message ? error.message : undefined;
    
    toast.error(
      context ? `${context}: ${title}` : title,
      detailMessage || message
    );
  } else if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error
    const { title, message } = getErrorMessage('NETWORK_ERROR');
    toast.error(
      context ? `${context}: ${title}` : title,
      message
    );
  } else if (error instanceof Error) {
    toast.error(
      context ? `${context}失败` : '操作失败',
      error.message
    );
  } else {
    const { title, message } = getErrorMessage('UNKNOWN_ERROR');
    toast.error(title, message);
  }
}

/**
 * Handle form validation errors
 */
export function handleValidationError(
  errors: Record<string, string>,
  context?: string
): void {
  const errorMessages = Object.values(errors).filter(Boolean);
  
  if (errorMessages.length > 0) {
    toast.error(
      context ? `${context}: 验证失败` : '验证失败',
      errorMessages[0] // Show first error
    );
  }
}

/**
 * Handle import errors with detailed feedback
 * Validates: Requirement 8.3
 */
export function handleImportError(error: unknown): void {
  if (error instanceof SyntaxError) {
    toast.error('JSON 格式错误', '配置文件不是有效的 JSON 格式');
    return;
  }
  
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_IMPORT_FORMAT') {
      toast.error(
        '导入格式无效',
        error.details?.reason || '配置文件结构不正确'
      );
      return;
    }
    
    if (error.code === 'IMPORT_VALIDATION_ERROR') {
      toast.error(
        '导入验证失败',
        error.details?.field 
          ? `字段 "${error.details.field}" 无效: ${error.details.reason}`
          : '配置数据验证失败'
      );
      return;
    }
  }
  
  handleApiError(error, '导入配置');
}

/**
 * Handle bot start errors with specific feedback
 * Validates: Requirement 7.4
 */
export function handleBotStartError(error: unknown, botName: string): void {
  if (error instanceof ApiError) {
    if (error.code === 'MISSING_API_KEYS') {
      const missingKeys = error.details?.missingKeys || '未知';
      toast.error(
        `无法启动 "${botName}"`,
        `缺少必需的 API 密钥: ${missingKeys}`
      );
      return;
    }
    
    if (error.code === 'BOT_ALREADY_RUNNING') {
      toast.warning(
        `"${botName}" 已在运行`,
        '该机器人已经启动，无需重复启动'
      );
      return;
    }
  }
  
  handleApiError(error, `启动 "${botName}"`);
}

/**
 * Handle bot stop errors
 */
export function handleBotStopError(error: unknown, botName: string): void {
  if (error instanceof ApiError && error.code === 'BOT_NOT_RUNNING') {
    toast.warning(
      `"${botName}" 未在运行`,
      '该机器人当前未启动'
    );
    return;
  }
  
  handleApiError(error, `停止 "${botName}"`);
}

/**
 * Create a wrapped async function with error handling
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      throw error;
    }
  }) as T;
}

export default {
  getErrorMessage,
  formatErrorDetails,
  handleApiError,
  handleValidationError,
  handleImportError,
  handleBotStartError,
  handleBotStopError,
  withErrorHandling,
};
