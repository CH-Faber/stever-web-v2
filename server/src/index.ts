import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import botsRouter from './routes/bots.js';
import keysRouter from './routes/keys.js';
import settingsRouter from './routes/settings.js';
import tasksRouter from './routes/tasks.js';
import importExportRouter from './routes/importExport.js';
import modelsRouter from './routes/models.js';
import endpointsRouter from './routes/endpoints.js';
import modelPresetsRouter from './routes/modelPresets.js';
import {
  initializeWebSocket,
  broadcastBotStatus,
  broadcastBotLog,
  broadcastBotError,
  broadcastBotPosition,
  broadcastBotInventory,
} from './services/websocketService.js';
import {
  setStatusChangeCallback,
  setLogCallback,
  setPositionCallback,
  setInventoryCallback,
} from './services/processManagerService.js';
import { BotStatus, LogEntry, Position, InventoryItem } from '../../shared/types/index.js';

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Initialize WebSocket service with the Socket.IO server
initializeWebSocket(io);

// Wire up process manager callbacks to broadcast via WebSocket
setStatusChangeCallback((botId: string, status: BotStatus) => {
  broadcastBotStatus(botId, status);
  
  // Also broadcast error event if status is error
  if (status.status === 'error' && status.error) {
    broadcastBotError(botId, status.error);
  }
});

setLogCallback((botId: string, log: LogEntry) => {
  broadcastBotLog(botId, log);
});

setPositionCallback((botId: string, position: Position) => {
  broadcastBotPosition(botId, position);
});

setInventoryCallback((botId: string, inventory: InventoryItem[]) => {
  broadcastBotInventory(botId, inventory);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bot configuration API routes
app.use('/api/bots', botsRouter);

// API keys management routes
app.use('/api/keys', keysRouter);

// Server settings routes
app.use('/api/settings', settingsRouter);

// Task management routes
app.use('/api/tasks', tasksRouter);

// Import/Export routes
app.use('/api', importExportRouter);

// Models routes
app.use('/api/models', modelsRouter);

// Custom endpoints routes
app.use('/api/endpoints', endpointsRouter);

// Model presets routes
app.use('/api/model-presets', modelPresetsRouter);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, io, httpServer };
