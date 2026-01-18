import { create } from 'zustand';
import type { BotProfile, BotStatus, LogEntry, Position, InventoryItem } from '../../../shared/types';

interface BotWithStatus extends BotProfile {
  status: BotStatus;
}

interface BotsState {
  // State
  bots: BotProfile[];
  botStatuses: Record<string, BotStatus>;
  botLogs: Record<string, LogEntry[]>;
  botPositions: Record<string, Position>;
  botInventories: Record<string, InventoryItem[]>;
  loading: boolean;
  error: string | null;

  // Actions
  setBots: (bots: BotProfile[]) => void;
  addBot: (bot: BotProfile) => void;
  updateBot: (id: string, bot: Partial<BotProfile>) => void;
  removeBot: (id: string) => void;
  setBotStatus: (botId: string, status: BotStatus) => void;
  addBotLog: (botId: string, log: LogEntry) => void;
  setBotLogs: (botId: string, logs: LogEntry[]) => void;
  clearBotLogs: (botId: string) => void;
  setBotPosition: (botId: string, position: Position) => void;
  setBotInventory: (botId: string, inventory: InventoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getBotsWithStatus: () => BotWithStatus[];
  getActiveCount: () => number;
  getInactiveCount: () => number;
}

export const useBotsStore = create<BotsState>((set, get) => ({
  // Initial state
  bots: [],
  botStatuses: {},
  botLogs: {},
  botPositions: {},
  botInventories: {},
  loading: false,
  error: null,

  // Actions
  setBots: (bots) => set({ bots }),

  addBot: (bot) => set((state) => ({ 
    bots: [...state.bots, bot] 
  })),

  updateBot: (id, updates) => set((state) => ({
    bots: state.bots.map((bot) => 
      bot.id === id ? { ...bot, ...updates } : bot
    ),
  })),

  removeBot: (id) => set((state) => ({
    bots: state.bots.filter((bot) => bot.id !== id),
    botStatuses: Object.fromEntries(
      Object.entries(state.botStatuses).filter(([key]) => key !== id)
    ),
    botLogs: Object.fromEntries(
      Object.entries(state.botLogs).filter(([key]) => key !== id)
    ),
    botPositions: Object.fromEntries(
      Object.entries(state.botPositions).filter(([key]) => key !== id)
    ),
    botInventories: Object.fromEntries(
      Object.entries(state.botInventories).filter(([key]) => key !== id)
    ),
  })),

  setBotStatus: (botId, status) => set((state) => ({
    botStatuses: { ...state.botStatuses, [botId]: status },
  })),

  addBotLog: (botId, log) => set((state) => ({
    botLogs: {
      ...state.botLogs,
      [botId]: [...(state.botLogs[botId] || []), log].slice(-500), // Keep last 500 logs
    },
  })),

  setBotLogs: (botId, logs) => set((state) => ({
    botLogs: {
      ...state.botLogs,
      [botId]: logs.slice(-500), // Keep last 500 logs
    },
  })),

  clearBotLogs: (botId) => set((state) => ({
    botLogs: { ...state.botLogs, [botId]: [] },
  })),

  setBotPosition: (botId, position) => set((state) => ({
    botPositions: { ...state.botPositions, [botId]: position },
  })),

  setBotInventory: (botId, inventory) => set((state) => ({
    botInventories: { ...state.botInventories, [botId]: inventory },
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Computed getters
  getBotsWithStatus: () => {
    const { bots, botStatuses } = get();
    return bots.map((bot) => ({
      ...bot,
      status: botStatuses[bot.id] || { status: 'offline' as const },
    }));
  },

  getActiveCount: () => {
    const { botStatuses } = get();
    return Object.values(botStatuses).filter(
      (status) => status.status === 'online' || status.status === 'starting'
    ).length;
  },

  getInactiveCount: () => {
    const { bots, botStatuses } = get();
    const activeCount = Object.values(botStatuses).filter(
      (status) => status.status === 'online' || status.status === 'starting'
    ).length;
    return bots.length - activeCount;
  },
}));
