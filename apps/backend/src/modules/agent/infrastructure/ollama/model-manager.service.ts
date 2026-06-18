import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ModelProfile {
  name: string;
  size: string;
  speed: 'BLAZING' | 'FAST' | 'NORMAL' | 'SLOW';
  accuracy: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  vram: number;
  description: string;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

@Injectable()
export class ModelManagerService {
  private readonly logger = new Logger(ModelManagerService.name);
  private readonly ollamaUrl = process.env.OLLAMA_API || 'http://localhost:11434';
  private currentModel: string = process.env.OLLAMA_MODEL_DEFAULT || 'qwen2.5:7b-instruct-q2_K';
  private availableModels: Map<string, ModelProfile> = new Map();

  async onModuleInit() {
    this.logger.log('[MODEL-MANAGER] Initializing...');
    await this.loadModelProfiles();
    await this.listAvailableModels();
    this.logger.log(`[MODEL-MANAGER] Ready with model: ${this.currentModel}`);
  }

  private loadModelProfiles() {
    const profilesJson = process.env.MODEL_PROFILES || '{}';
    try {
      const profiles = JSON.parse(profilesJson);
      Object.entries(profiles).forEach(([name, profile]: [string, any]) => {
        this.availableModels.set(name, {
          name,
          ...profile,
        });
      });
      this.logger.log(`[MODEL-MANAGER] Loaded ${this.availableModels.size} model profiles`);
    } catch (err) {
      this.logger.warn('[MODEL-MANAGER] Could not parse model profiles');
    }
  }

  async listAvailableModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      this.logger.log(`[MODEL-MANAGER] Found ${models.length} local models`);
      return models;
    } catch (err: any) {
      this.logger.error('[MODEL-MANAGER] Failed to list models:', err.message);
      return [];
    }
  }

  async switchModel(modelName: string): Promise<boolean> {
    try {
      // Verify model exists
      const models = await this.listAvailableModels();
      const modelExists = models.some((m) => m.name === modelName);

      if (!modelExists) {
        this.logger.warn(`[MODEL-MANAGER] Model ${modelName} not found locally`);
        return false;
      }

      // Test model by pulling it
      await axios.post(`${this.ollamaUrl}/api/pull`, {
        name: modelName,
        stream: false,
      });

      this.currentModel = modelName;
      this.logger.log(`[MODEL-MANAGER] Switched to model: ${modelName}`);
      return true;
    } catch (err: any) {
      this.logger.error(`[MODEL-MANAGER] Failed to switch to ${modelName}:`, err.message);
      return false;
    }
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  getModelProfile(modelName?: string): ModelProfile | undefined {
    const name = modelName || this.currentModel;
    return this.availableModels.get(name);
  }

  getAllProfiles(): ModelProfile[] {
    return Array.from(this.availableModels.values());
  }

  // Auto-select best model for task
  selectBestModel(taskType: 'fast' | 'balanced' | 'accurate'): string {
    const profiles = this.getAllProfiles();

    switch (taskType) {
      case 'fast':
        return profiles.sort((a, b) => {
          const speedOrder = { BLAZING: 0, FAST: 1, NORMAL: 2, SLOW: 3 };
          return speedOrder[a.speed] - speedOrder[b.speed];
        })[0]?.name || this.currentModel;

      case 'accurate':
        return profiles.sort((a, b) => {
          const accuracyOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 };
          return accuracyOrder[b.accuracy] - accuracyOrder[a.accuracy];
        })[0]?.name || this.currentModel;

      case 'balanced':
      default:
        // Find model that's not too slow, not too inaccurate
        return (
          profiles.find((p) => p.speed === 'NORMAL' || p.speed === 'FAST') || profiles[0]
        ).name || this.currentModel;
    }
  }

  getModelRecommendation(dataRowCount: number): string {
    this.logger.log(`[MODEL-MANAGER] Recommending model for ${dataRowCount} rows`);

    if (dataRowCount < 1000) {
      // Small dataset - use fast model
      return this.selectBestModel('fast');
    } else if (dataRowCount < 10000) {
      // Medium dataset - use balanced
      return this.selectBestModel('balanced');
    } else {
      // Large dataset - use accurate (will be slower but better analysis)
      return this.selectBestModel('accurate');
    }
  }

  async getModelStats(): Promise<any> {
    return {
      currentModel: this.currentModel,
      profile: this.getModelProfile(),
      availableModels: this.getAllProfiles().map((p) => ({
        name: p.name,
        size: p.size,
        speed: p.speed,
        accuracy: p.accuracy,
        description: p.description,
      })),
      autoSelectEnabled: process.env.OLLAMA_AUTO_SELECT === 'true',
    };
  }
}
