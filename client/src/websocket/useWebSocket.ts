import { useEffect, useState, useCallback } from 'react';
import { wsClient, type ConnectionStatus } from './client';
import { useBotsStore } from '../stores';

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>(wsClient.getStatus());

  useEffect(() => {
    // Connect on mount
    wsClient.connect();

    // Subscribe to status changes
    const unsubscribe = wsClient.onStatusChange(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  const connect = useCallback(() => {
    wsClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
  };
}

export function useBotSubscription(botId: string | null) {
  const { setBotStatus, addBotLog, setBotPosition, setBotInventory } = useBotsStore();

  useEffect(() => {
    if (!botId) return;

    // Subscribe to bot
    wsClient.subscribe(botId);

    // Set up event handlers
    const unsubStatus = wsClient.onBotStatus((data) => {
      if (data.botId === botId) {
        setBotStatus(data.botId, data.status);
      }
    });

    const unsubLog = wsClient.onBotLog((data) => {
      if (data.botId === botId) {
        addBotLog(data.botId, data.log);
      }
    });

    const unsubPosition = wsClient.onBotPosition((data) => {
      if (data.botId === botId) {
        setBotPosition(data.botId, data.position);
      }
    });

    const unsubInventory = wsClient.onBotInventory((data) => {
      if (data.botId === botId) {
        setBotInventory(data.botId, data.inventory);
      }
    });

    return () => {
      wsClient.unsubscribe(botId);
      unsubStatus();
      unsubLog();
      unsubPosition();
      unsubInventory();
    };
  }, [botId, setBotStatus, addBotLog, setBotPosition, setBotInventory]);
}

export function useAllBotsSubscription() {
  const { setBotStatus, addBotLog } = useBotsStore();

  useEffect(() => {
    // Set up global event handlers for all bots
    const unsubStatus = wsClient.onBotStatus((data) => {
      setBotStatus(data.botId, data.status);
    });

    const unsubLog = wsClient.onBotLog((data) => {
      addBotLog(data.botId, data.log);
    });

    const unsubError = wsClient.onBotError((data) => {
      setBotStatus(data.botId, { status: 'error', error: data.error });
    });

    return () => {
      unsubStatus();
      unsubLog();
      unsubError();
    };
  }, [setBotStatus, addBotLog]);
}
