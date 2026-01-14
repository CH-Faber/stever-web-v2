import { io, Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  BotStatusEvent,
  BotLogEvent,
  BotPositionEvent,
  BotInventoryEvent,
  BotErrorEvent,
} from '../../../shared/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WebSocketClientOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

type EventCallback<T> = (data: T) => void;

class WebSocketClient {
  private socket: TypedSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private subscribedBots: Set<string> = new Set();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private options: Required<WebSocketClientOptions>;

  // Event handlers
  private botStatusHandlers: Set<EventCallback<BotStatusEvent>> = new Set();
  private botLogHandlers: Set<EventCallback<BotLogEvent>> = new Set();
  private botPositionHandlers: Set<EventCallback<BotPositionEvent>> = new Set();
  private botInventoryHandlers: Set<EventCallback<BotInventoryEvent>> = new Set();
  private botErrorHandlers: Set<EventCallback<BotErrorEvent>> = new Set();

  constructor(options: WebSocketClientOptions = {}) {
    this.options = {
      autoConnect: options.autoConnect ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? 5,
      reconnectionDelay: options.reconnectionDelay ?? 1000,
    };
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.setStatus('connecting');

    this.socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscribedBots.clear();
      this.setStatus('disconnected');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WS] Connected to server');
      this.setStatus('connected');
      // Re-subscribe to previously subscribed bots
      this.subscribedBots.forEach((botId) => {
        console.log('[WS] Re-subscribing to bot:', botId);
        this.socket?.emit('subscribe', botId);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('[WS] Disconnected from server');
      this.setStatus('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.log('[WS] Connection error:', err.message);
      this.setStatus('error');
    });

    // Bot events
    this.socket.on('bot:status', (data) => {
      console.log('[WS] Received bot:status', data);
      this.botStatusHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('bot:log', (data) => {
      console.log('[WS] Received bot:log', data.botId, data.log.message.substring(0, 50));
      this.botLogHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('bot:position', (data) => {
      console.log('[WS] Received bot:position', data);
      this.botPositionHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('bot:inventory', (data) => {
      console.log('[WS] Received bot:inventory', data);
      this.botInventoryHandlers.forEach((handler) => handler(data));
    });

    this.socket.on('bot:error', (data) => {
      console.log('[WS] Received bot:error', data);
      this.botErrorHandlers.forEach((handler) => handler(data));
    });
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  // Connection status subscription
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // Bot subscription management
  subscribe(botId: string): void {
    console.log('[WS] Subscribing to bot:', botId);
    this.subscribedBots.add(botId);
    if (this.socket?.connected) {
      this.socket.emit('subscribe', botId);
    }
  }

  unsubscribe(botId: string): void {
    console.log('[WS] Unsubscribing from bot:', botId);
    this.subscribedBots.delete(botId);
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', botId);
    }
  }

  getSubscribedBots(): string[] {
    return Array.from(this.subscribedBots);
  }

  // Event subscriptions
  onBotStatus(callback: EventCallback<BotStatusEvent>): () => void {
    this.botStatusHandlers.add(callback);
    return () => this.botStatusHandlers.delete(callback);
  }

  onBotLog(callback: EventCallback<BotLogEvent>): () => void {
    this.botLogHandlers.add(callback);
    return () => this.botLogHandlers.delete(callback);
  }

  onBotPosition(callback: EventCallback<BotPositionEvent>): () => void {
    this.botPositionHandlers.add(callback);
    return () => this.botPositionHandlers.delete(callback);
  }

  onBotInventory(callback: EventCallback<BotInventoryEvent>): () => void {
    this.botInventoryHandlers.add(callback);
    return () => this.botInventoryHandlers.delete(callback);
  }

  onBotError(callback: EventCallback<BotErrorEvent>): () => void {
    this.botErrorHandlers.add(callback);
    return () => this.botErrorHandlers.delete(callback);
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

export { WebSocketClient, type ConnectionStatus };
