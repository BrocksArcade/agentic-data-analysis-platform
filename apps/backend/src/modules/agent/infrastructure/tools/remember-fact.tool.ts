import { Injectable } from '@nestjs/common';
import { SessionMemory } from '@platform/shared';
import { BaseTool } from './base.tool';

@Injectable()
export class RememberFactTool extends BaseTool {
  name = 'remember_fact';

  async execute(input: Record<string, any>, session?: SessionMemory): Promise<any> {
    try {
      if (!session) {
        return this.handleError('Session not provided');
      }
      const fact = input.fact;
      session.knownFacts.push(fact);
      return this.handleSuccess({
        saved: true,
        fact,
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
