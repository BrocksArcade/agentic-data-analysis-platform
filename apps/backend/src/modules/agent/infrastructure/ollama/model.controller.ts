import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ModelManagerService } from './model-manager.service';

@Controller('api/models')
export class ModelController {
  private readonly logger = new Logger(ModelController.name);

  constructor(private modelManager: ModelManagerService) {}

  @Get('stats')
  async getModelStats() {
    this.logger.log('[MODEL-CONTROLLER] GET /stats');
    return this.modelManager.getModelStats();
  }

  @Get('list')
  async listModels() {
    this.logger.log('[MODEL-CONTROLLER] GET /list');
    return {
      models: this.modelManager.getAllProfiles(),
      current: this.modelManager.getCurrentModel(),
    };
  }

  @Post('switch')
  async switchModel(@Body() payload: { model: string }) {
    this.logger.log(`[MODEL-CONTROLLER] POST /switch model=${payload.model}`);
    const success = await this.modelManager.switchModel(payload.model);
    return {
      success,
      currentModel: this.modelManager.getCurrentModel(),
      message: success ? `Switched to ${payload.model}` : `Failed to switch to ${payload.model}`,
    };
  }

  @Post('recommend')
  async recommendModel(@Body() payload: { rowCount: number }) {
    this.logger.log(`[MODEL-CONTROLLER] POST /recommend rows=${payload.rowCount}`);
    const recommended = this.modelManager.getModelRecommendation(payload.rowCount);
    return {
      recommended,
      reason:
        payload.rowCount < 1000
          ? 'Small dataset - using fast model'
          : payload.rowCount < 10000
            ? 'Medium dataset - using balanced model'
            : 'Large dataset - using accurate model',
      currentModel: this.modelManager.getCurrentModel(),
    };
  }

  @Get('profiles')
  async getModelProfiles() {
    this.logger.log('[MODEL-CONTROLLER] GET /profiles');
    return {
      profiles: this.modelManager.getAllProfiles().map((p) => ({
        name: p.name,
        size: p.size,
        speed: p.speed,
        accuracy: p.accuracy,
        vram: p.vram,
        description: p.description,
      })),
    };
  }
}
