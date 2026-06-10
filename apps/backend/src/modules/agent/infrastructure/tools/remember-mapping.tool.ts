import { Injectable } from '@nestjs/common';
import { SessionMemory } from '@platform/shared';
import { BaseTool } from './base.tool';

@Injectable()
export class RememberMappingTool extends BaseTool {
  name = 'remember_mapping';

  async execute(input: Record<string, any>, session?: SessionMemory): Promise<any> {
    try {
      if (!session) {
        return this.handleError('Session not provided');
      }
      const userTerm = input.userTerm;
      const actualColumn = input.actualColumn;
      session.columnMappings.push({ userTerm, actualColumn });
      return this.handleSuccess({
        saved: true,
        mapping: { userTerm, actualColumn },
      });
    } catch (err: any) {
      return this.handleError(err);
    }
  }
}
