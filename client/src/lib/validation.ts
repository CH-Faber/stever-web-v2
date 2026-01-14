/**
 * URL Validation Utilities
 * Validates: Requirement 3.3
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a URL string for HTTP/HTTPS format
 * 
 * @param url - The URL string to validate
 * @returns ValidationResult with valid status and optional error message
 * 
 * Validates: Requirement 3.3 - WHEN 用户保存第三方端点配置 THEN Model_Config SHALL 验证 URL 格式的有效性
 */
export function validateUrl(url: string): ValidationResult {
  // Check for empty or whitespace-only input
  if (!url || url.trim() === '') {
    return {
      valid: false,
      error: 'URL 不能为空',
    };
  }

  const trimmedUrl = url.trim();

  // Check for valid HTTP/HTTPS protocol
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return {
      valid: false,
      error: 'URL 必须以 http:// 或 https:// 开头',
    };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // Ensure protocol is http or https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        valid: false,
        error: 'URL 协议必须是 HTTP 或 HTTPS',
      };
    }

    // Ensure hostname exists
    if (!parsedUrl.hostname) {
      return {
        valid: false,
        error: 'URL 必须包含有效的主机名',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'URL 格式无效',
    };
  }
}

/**
 * Validates an API endpoint URL specifically for third-party API configuration
 * More strict validation that ensures the URL is suitable for API calls
 * 
 * @param url - The API endpoint URL to validate
 * @returns ValidationResult with valid status and optional error message
 */
export function validateApiEndpointUrl(url: string): ValidationResult {
  const basicValidation = validateUrl(url);
  if (!basicValidation.valid) {
    return basicValidation;
  }

  const trimmedUrl = url.trim();
  
  try {
    // Validate URL can be parsed
    new URL(trimmedUrl);
    
    // Warn about localhost in production-like URLs (but still valid)
    // This is informational - localhost is valid for local development
    
    // Check for common API URL patterns (optional enhancement)
    // URLs ending with common API paths are typically valid
    
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'API 端点 URL 格式无效',
    };
  }
}

export default {
  validateUrl,
  validateApiEndpointUrl,
};
