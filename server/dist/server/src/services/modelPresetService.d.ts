import type { ModelPreset, CreateModelPresetRequest, UpdateModelPresetRequest, ModelPresetPurpose } from '../../../shared/types/index.js';
export declare const modelPresetService: {
    /**
     * 获取所有模型预设
     */
    getAll(): ModelPreset[];
    /**
     * 根据 ID 获取模型预设
     */
    getById(id: string): ModelPreset | undefined;
    /**
     * 根据用途获取模型预设
     */
    getByPurpose(purpose: ModelPresetPurpose): ModelPreset[];
    /**
     * 获取某用途的默认预设
     */
    getDefault(purpose: ModelPresetPurpose): ModelPreset | undefined;
    /**
     * 创建模型预设
     */
    create(data: CreateModelPresetRequest): ModelPreset;
    /**
     * 更新模型预设
     */
    update(id: string, data: UpdateModelPresetRequest): ModelPreset;
    /**
     * 删除模型预设
     */
    delete(id: string): void;
    /**
     * 设置为默认预设
     */
    setDefault(id: string): ModelPreset;
};
