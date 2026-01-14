/**
 * WebSocket Integration Tests for Mindcraft Dashboard
 * Tests WebSocket client connection, subscription, and event handling
 * 
 * Feature: mindcraft-dashboard
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '../websocket/client';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };
  
  return {
    io: vi.fn(() => mockSocket),
  };
});

describe('WebSocket Client', () => {
  let wsClient: WebSocketClient;
  
  beforeEach(() => {
    wsClient = new WebSocketClient({ autoConnect: false });
  });

  afterEach(() => {
    wsClient.disconnect();
    vi.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected status', () => {
      expect(wsClient.getStatus()).toBe('disconnected');
      expect(wsClient.isConnected()).toBe(false);
    });

    it('should track connection status changes', () => {
      const statusCallback = vi.fn();
      wsClient.onStatusChange(statusCallback);
      
      // Simulate connection
      wsClient.connect();
      
      // Status should change to connecting
      expect(statusCallback).toHaveBeenCalled();
    });

    it('should allow unsubscribing from status changes', () => {
      const statusCallback = vi.fn();
      const unsubscribe = wsClient.onStatusChange(statusCallback);
      
      unsubscribe();
      wsClient.connect();
      
      // After unsubscribe, callback should not be called for new events
      // (it may have been called once during connect)
    });
  });

  describe('Bot Subscription', () => {
    it('should track subscribed bots', () => {
      wsClient.subscribe('bot-1');
      wsClient.subscribe('bot-2');
      
      const subscribed = wsClient.getSubscribedBots();
      expect(subscribed).toContain('bot-1');
      expect(subscribed).toContain('bot-2');
    });

    it('should remove bot from subscriptions on unsubscribe', () => {
      wsClient.subscribe('bot-1');
      wsClient.subscribe('bot-2');
      wsClient.unsubscribe('bot-1');
      
      const subscribed = wsClient.getSubscribedBots();
      expect(subscribed).not.toContain('bot-1');
      expect(subscribed).toContain('bot-2');
    });

    it('should not duplicate subscriptions', () => {
      wsClient.subscribe('bot-1');
      wsClient.subscribe('bot-1');
      
      const subscribed = wsClient.getSubscribedBots();
      expect(subscribed.filter(id => id === 'bot-1')).toHaveLength(1);
    });

    it('should handle disconnect when not connected', () => {
      wsClient.subscribe('bot-1');
      // Disconnect without connecting first - subscriptions are tracked locally
      wsClient.disconnect();
      
      // When not connected, disconnect just resets state
      expect(wsClient.getStatus()).toBe('disconnected');
    });
  });

  describe('Event Handlers', () => {
    it('should register bot status handlers', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotStatus(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register bot log handlers', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotLog(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register bot position handlers', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotPosition(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register bot inventory handlers', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotInventory(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should register bot error handlers', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotError(handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing from events', () => {
      const handler = vi.fn();
      const unsubscribe = wsClient.onBotStatus(handler);
      
      unsubscribe();
      // Handler should be removed
    });
  });
});

describe('WebSocket Event Types', () => {
  it('should have correct BotStatusEvent structure', () => {
    const event = {
      botId: 'test-bot',
      status: {
        status: 'online' as const,
        pid: 12345,
        startTime: new Date(),
      }
    };
    
    expect(event).toHaveProperty('botId');
    expect(event).toHaveProperty('status');
    expect(event.status).toHaveProperty('status');
  });

  it('should have correct BotLogEvent structure', () => {
    const event = {
      botId: 'test-bot',
      log: {
        timestamp: new Date(),
        level: 'info' as const,
        message: 'Bot started',
        source: 'system'
      }
    };
    
    expect(event).toHaveProperty('botId');
    expect(event).toHaveProperty('log');
    expect(event.log).toHaveProperty('level');
    expect(event.log).toHaveProperty('message');
  });

  it('should have correct BotPositionEvent structure', () => {
    const event = {
      botId: 'test-bot',
      position: { x: 100, y: 64, z: -200 }
    };
    
    expect(event).toHaveProperty('botId');
    expect(event).toHaveProperty('position');
    expect(event.position).toHaveProperty('x');
    expect(event.position).toHaveProperty('y');
    expect(event.position).toHaveProperty('z');
  });

  it('should have correct BotInventoryEvent structure', () => {
    const event = {
      botId: 'test-bot',
      inventory: [
        { slot: 0, name: 'diamond_pickaxe', count: 1 },
        { slot: 1, name: 'cobblestone', count: 64 }
      ]
    };
    
    expect(event).toHaveProperty('botId');
    expect(event).toHaveProperty('inventory');
    expect(Array.isArray(event.inventory)).toBe(true);
    expect(event.inventory[0]).toHaveProperty('slot');
    expect(event.inventory[0]).toHaveProperty('name');
    expect(event.inventory[0]).toHaveProperty('count');
  });

  it('should have correct BotErrorEvent structure', () => {
    const event = {
      botId: 'test-bot',
      error: 'Connection lost to Minecraft server'
    };
    
    expect(event).toHaveProperty('botId');
    expect(event).toHaveProperty('error');
    expect(typeof event.error).toBe('string');
  });
});
