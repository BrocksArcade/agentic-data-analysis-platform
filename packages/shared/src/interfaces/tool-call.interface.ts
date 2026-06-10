export interface ToolCall {
  tool_use_id: string;
  type: 'tool_use';
  name: string;
  input: Record<string, any>;
}
