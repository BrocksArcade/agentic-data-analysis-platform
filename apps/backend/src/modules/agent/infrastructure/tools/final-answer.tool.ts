import { Injectable } from '@nestjs/common';
import { ChartContract } from '@platform/shared';
import { BaseTool } from './base.tool';

@Injectable()
export class FinalAnswerTool extends BaseTool {
  name = 'final_answer';

  async execute(input: Record<string, any>): Promise<any> {
    try {
      const chartContract = input as ChartContract;

      if (!chartContract.chartType) {
        return this.handleError('chartType is required');
      }

      const noSeriesNeeded = chartContract.chartType === 'error' || chartContract.chartType === 'text';
      if (!noSeriesNeeded && (!chartContract.series || chartContract.series.length === 0)) {
        return this.handleError('series data is required');
      }

      return this.handleSuccess({
        validated: true,
        contract: chartContract,
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
