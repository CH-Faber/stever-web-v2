import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff, Bug, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'network' | 'runtime' | 'unknown';
  copied: boolean;
}

/**
 * Categorize error type for better user feedback
 */
function categorizeError(error: Error): 'network' | 'runtime' | 'unknown' {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Network-related errors
  if (
    name === 'typeerror' && message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('net::') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('offline')
  ) {
    return 'network';
  }
  
  // Runtime errors (syntax, reference, type errors in code)
  if (
    name === 'syntaxerror' ||
    name === 'referenceerror' ||
    name === 'rangeerror' ||
    (name === 'typeerror' && !message.includes('fetch'))
  ) {
    return 'runtime';
  }
  
  return 'unknown';
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(errorType: 'network' | 'runtime' | 'unknown'): { title: string; description: string } {
  switch (errorType) {
    case 'network':
      return {
        title: '网络连接问题',
        description: '无法连接到服务器。请检查您的网络连接，确保后端服务正在运行，然后重试。',
      };
    case 'runtime':
      return {
        title: '应用程序错误',
        description: '应用程序遇到了内部错误。这可能是一个程序问题，请尝试刷新页面。',
      };
    default:
      return {
        title: '出现了一些问题',
        description: '应用程序遇到了意外错误。请尝试刷新页面或返回首页。',
      };
  }
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI with categorized error messages.
 * 
 * Validates: Requirements 7.4, 8.3
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorType: categorizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: 'unknown',
      copied: false,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleRefreshPage = (): void => {
    window.location.reload();
  };

  handleCopyError = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const errorText = [
      `Error: ${error?.name || 'Unknown'}`,
      `Message: ${error?.message || 'No message'}`,
      `Stack: ${error?.stack || 'No stack trace'}`,
      `Component Stack: ${errorInfo?.componentStack || 'No component stack'}`,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      console.error('Failed to copy error to clipboard');
    }
  };

  renderErrorIcon(): ReactNode {
    const { errorType } = this.state;
    
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-8 h-8 text-amber-500" />;
      case 'runtime':
        return <Bug className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
  }

  renderIconBackground(): string {
    const { errorType } = this.state;
    
    switch (errorType) {
      case 'network':
        return 'bg-amber-100';
      case 'runtime':
        return 'bg-red-100';
      default:
        return 'bg-red-100';
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorType, copied } = this.state;
      const { title, description } = getErrorMessage(errorType);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${this.renderIconBackground()} rounded-full flex items-center justify-center`}>
                {this.renderErrorIcon()}
              </div>
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {description}
            </p>

            {error && (
              <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">错误详情:</p>
                  <button
                    onClick={this.handleCopyError}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    title="复制错误信息"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-red-600 font-mono break-all">
                  {error.message}
                </p>
                {error.name && error.name !== 'Error' && (
                  <p className="text-xs text-gray-500 mt-1">
                    类型: {error.name}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              {errorType === 'network' ? (
                <button
                  onClick={this.handleRefreshPage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  刷新页面
                </button>
              ) : (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>

            {/* Help text for network errors */}
            {errorType === 'network' && (
              <p className="text-xs text-gray-500 mt-4">
                提示: 请确保后端服务器正在运行 (默认端口: 3001)
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
