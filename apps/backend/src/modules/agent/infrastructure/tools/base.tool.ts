import { SessionMemory } from '@platform/shared';

export abstract class BaseTool {
  abstract name: string;

  abstract execute(
    input: Record<string, any>,
    session?: SessionMemory,
  ): Promise<any>;

  protected handleError(error: any): { success: false; error: string } {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  protected handleSuccess(data: any): { success: true; [key: string]: any } {
    return { success: true, ...data };
  }
}
