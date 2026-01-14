import * as fs from 'fs';
import * as path from 'path';
import type {
  ModelPreset,
  CreateModelPresetRequest,
  UpdateModelPresetRequest,
  ModelPresetPurpose,
} from '../../../shared/types/index.js';

const PRESETS_FILE = path.join(process.cwd(), '..', 'model-presets.json');

function generateId(): string {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function loadPresets(): ModelPreset[] {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      const presets = JSON.parse(data);
      return presets.map((p: ModelPreset) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error loading model presets:', error);
  }
  return [];
}

function savePresets(presets: ModelPreset[]): void {
  try {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving model presets:', error);
    throw new Error('Failed to save model presets');
  }
}

export const modelPresetService = {
  /**
   * 获取所有模型预设
   */
  getAll(): ModelPreset[] {
    return loadPresets();
  },

  /**
   * 根据 ID 获取模型预设
   */
  getById(id: string): ModelPreset | undefined {
    const presets = loadPresets();
    return presets.find((p) => p.id === id);
  },

  /**
   * 根据用途获取模型预设
   */
  getByPurpose(purpose: ModelPresetPurpose): ModelPreset[] {
    const presets = loadPresets();
    return presets.filter((p) => p.purpose === purpose);
  },

  /**
   * 获取某用途的默认预设
   */
  getDefault(purpose: ModelPresetPurpose): ModelPreset | undefined {
    const presets = loadPresets();
    return presets.find((p) => p.purpose === purpose && p.isDefault);
  },

  /**
   * 创建模型预设
   */
  create(data: CreateModelPresetRequest): ModelPreset {
    const presets = loadPresets();
    const now = new Date();

    // If setting as default, remove default from other presets of same purpose
    if (data.isDefault) {
      presets.forEach((p) => {
        if (p.purpose === data.purpose) {
          p.isDefault = false;
        }
      });
    }

    const newPreset: ModelPreset = {
      id: generateId(),
      name: data.name,
      description: data.description,
      purpose: data.purpose,
      config: data.config,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };

    presets.push(newPreset);
    savePresets(presets);

    return newPreset;
  },

  /**
   * 更新模型预设
   */
  update(id: string, data: UpdateModelPresetRequest): ModelPreset {
    const presets = loadPresets();
    const index = presets.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Model preset not found');
    }

    const existing = presets[index];

    // If setting as default, remove default from other presets of same purpose
    const newPurpose = data.purpose || existing.purpose;
    if (data.isDefault) {
      presets.forEach((p) => {
        if (p.purpose === newPurpose && p.id !== id) {
          p.isDefault = false;
        }
      });
    }

    const updated: ModelPreset = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      purpose: data.purpose ?? existing.purpose,
      config: data.config ?? existing.config,
      isDefault: data.isDefault ?? existing.isDefault,
      updatedAt: new Date(),
    };

    presets[index] = updated;
    savePresets(presets);

    return updated;
  },

  /**
   * 删除模型预设
   */
  delete(id: string): void {
    const presets = loadPresets();
    const index = presets.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Model preset not found');
    }

    presets.splice(index, 1);
    savePresets(presets);
  },

  /**
   * 设置为默认预设
   */
  setDefault(id: string): ModelPreset {
    const presets = loadPresets();
    const preset = presets.find((p) => p.id === id);

    if (!preset) {
      throw new Error('Model preset not found');
    }

    // Remove default from other presets of same purpose
    presets.forEach((p) => {
      if (p.purpose === preset.purpose) {
        p.isDefault = p.id === id;
      }
    });

    preset.updatedAt = new Date();
    savePresets(presets);

    return preset;
  },
};
