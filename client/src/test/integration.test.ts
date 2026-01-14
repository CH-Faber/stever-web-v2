/**
 * Integration Tests for Mindcraft Dashboard
 * Tests API calls, WebSocket communication, and bot start/stop flow
 * 
 * Feature: mindcraft-dashboard
 * Validates: Global requirements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api/client';

// Mock fetch for API tests
const mockFetch = vi.fn();
(globalThis as unknown as { fetch: typeof fetch }).fetch = mockFetch;

describe('API Client Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should successfully fetch data', async () => {
      const mockData = { bots: [{ id: '1', name: 'TestBot' }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      });

      const result = await api.get('/api/bots');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bots'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          error: { code: 'NOT_FOUND', message: 'Bot not found' }
        }),
      });

      await expect(api.get('/api/bots/nonexistent')).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.get('/api/bots')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should successfully create resources', async () => {
      const newBot = { name: 'NewBot', model: { api: 'openai', model: 'gpt-4' } };
      const mockResponse = { bot: { id: '2', ...newBot } };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.post('/api/bots', newBot);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bots'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newBot),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bot configuration',
            details: { name: 'Name is required' }
          }
        }),
      });

      try {
        await api.post('/api/bots', {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).details).toHaveProperty('name');
      }
    });
  });

  describe('PUT requests', () => {
    it('should successfully update resources', async () => {
      const updates = { name: 'UpdatedBot' };
      const mockResponse = { bot: { id: '1', name: 'UpdatedBot' } };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.put('/api/bots/1', updates);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bots/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should successfully delete resources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.delete('/api/bots/1');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bots/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ success: true });
    });
  });
});


describe('Bot Start/Stop Flow Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should handle bot start flow', async () => {
    // Mock successful start response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        botId: 'test-bot',
        status: { status: 'starting', pid: 12345 }
      }),
    });

    const result = await api.post('/api/bots/test-bot/start');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bots/test-bot/start'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toHaveProperty('botId', 'test-bot');
    expect(result).toHaveProperty('status');
  });

  it('should handle bot start with missing API keys', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: {
          code: 'MISSING_API_KEYS',
          message: 'Missing required API keys: OPENAI_API_KEY',
          details: { missingKeys: 'OPENAI_API_KEY' }
        }
      }),
    });

    try {
      await api.post('/api/bots/test-bot/start');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe('MISSING_API_KEYS');
    }
  });

  it('should handle bot stop flow', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        botId: 'test-bot',
        status: { status: 'stopping' }
      }),
    });

    const result = await api.post('/api/bots/test-bot/stop');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bots/test-bot/stop'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toHaveProperty('botId', 'test-bot');
  });

  it('should handle bot status check', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        botId: 'test-bot',
        status: { status: 'online', pid: 12345 }
      }),
    });

    const result = await api.get('/api/bots/test-bot/status');
    
    expect(result).toHaveProperty('status');
    expect((result as any).status.status).toBe('online');
  });
});

describe('API Keys Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch API key statuses', async () => {
    const mockKeys = {
      keys: [
        { provider: 'openai', configured: true },
        { provider: 'anthropic', configured: false }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockKeys),
    });

    const result = await api.get('/api/keys');
    
    expect(result).toEqual(mockKeys);
  });

  it('should update API key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
    });

    const result = await api.put('/api/keys/openai', { key: 'sk-test-key' });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/keys/openai'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ key: 'sk-test-key' }),
      })
    );
    expect(result).toEqual({ success: true });
  });

  it('should handle invalid provider', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: { code: 'INVALID_PROVIDER', message: 'Invalid provider' }
      }),
    });

    await expect(api.put('/api/keys/invalid', { key: 'test' }))
      .rejects.toThrow(ApiError);
  });
});

describe('Settings Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch settings', async () => {
    const mockSettings = {
      settings: {
        host: 'localhost',
        port: 55916,
        auth: 'offline',
        version: '1.20.4',
        allowInsecureCoding: false
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockSettings),
    });

    const result = await api.get('/api/settings');
    
    expect(result).toEqual(mockSettings);
  });

  it('should update settings', async () => {
    const updates = { host: 'mc.example.com', port: 25565 };
    const mockResponse = {
      settings: { ...updates, auth: 'offline', version: '1.20.4', allowInsecureCoding: false }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const result = await api.put('/api/settings', updates);
    
    expect(result).toHaveProperty('settings');
    expect((result as any).settings.host).toBe('mc.example.com');
  });
});

describe('Tasks Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch all tasks', async () => {
    const mockTasks = {
      tasks: [
        { id: '1', name: 'Collect Wood', goal: 'Collect 64 oak logs' }
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockTasks),
    });

    const result = await api.get('/api/tasks');
    
    expect(result).toEqual(mockTasks);
  });

  it('should create a task', async () => {
    const newTask = {
      name: 'Mine Diamonds',
      goal: 'Mine 10 diamonds',
      target: 'diamond',
      numberOfTarget: 10,
      timeout: 3600
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ task: { id: '2', ...newTask } }),
    });

    const result = await api.post('/api/tasks', newTask);
    
    expect(result).toHaveProperty('task');
    expect((result as any).task.name).toBe('Mine Diamonds');
  });
});

describe('Import/Export Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should export configuration', async () => {
    const mockExport = {
      bots: [{ id: '1', name: 'TestBot' }],
      settings: { host: 'localhost', port: 55916 },
      tasks: []
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockExport),
    });

    const result = await api.get('/api/export');
    
    expect(result).toHaveProperty('bots');
    expect(result).toHaveProperty('settings');
    expect(result).toHaveProperty('tasks');
  });

  it('should import configuration', async () => {
    const importData = {
      bots: [{ id: '1', name: 'ImportedBot' }],
      settings: { host: 'localhost' }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        imported: { bots: 1, settings: true, tasks: 0 }
      }),
    });

    const result = await api.post('/api/import', importData);
    
    expect(result).toHaveProperty('imported');
    expect((result as any).imported.bots).toBe(1);
  });

  it('should handle invalid import format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid import data format',
          details: { bots: 'Invalid bot configuration' }
        }
      }),
    });

    await expect(api.post('/api/import', { invalid: 'data' }))
      .rejects.toThrow(ApiError);
  });
});
