import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Message } from '@platform/shared';

export interface OllamaChatOptions {
  model?: string;
  think?: boolean;
  timeoutMs?: number;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  readonly baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  readonly explorationModel = process.env.OLLAMA_EXPLORATION_MODEL || 'analyst';
  readonly thinkingModel = process.env.OLLAMA_THINKING_MODEL || 'analyst';
  readonly codegenModel = process.env.OLLAMA_CODEGEN_MODEL || 'analyst';

  private readonly maxHistory = 10;

  async chat(
    systemPrompt: string,
    messages: Message[],
    options: OllamaChatOptions = {},
  ): Promise<string> {
    const model = options.model ?? this.thinkingModel;
    const think = options.think ?? false;
    const timeoutMs = options.timeoutMs ?? 120000;

    const recent = messages.slice(-this.maxHistory);
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...recent.map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      })),
    ];

    const lastUser = [...ollamaMessages].reverse().find((m) => m.role === 'user');
    this.logger.log(`[OLLAMA] POST ${this.baseUrl}/api/chat model=${model} think=${think} messages=${ollamaMessages.length} lastUser="${lastUser?.content?.slice(0, 120)}"`);

    const start = Date.now();

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        { model, messages: ollamaMessages, stream: false, think },
        { timeout: timeoutMs },
      );

      const elapsed = Date.now() - start;
      const msg = response.data.message;
      const content = msg.content;
      const thinking = msg.thinking;
      const usage = response.data.usage;

      this.logger.log(
        `[OLLAMA] response in ${elapsed}ms — ${content.length} chars` +
        (thinking ? ` | thinking=${thinking.length} chars` : '') +
        (usage ? ` | prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens}` : ''),
      );

      if (thinking) {
        this.logger.debug(`[OLLAMA] thinking: ${thinking.slice(0, 500)}`);
      }

      return content;
    } catch (err: any) {
      const elapsed = Date.now() - start;
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      this.logger.error(`[OLLAMA] failed after ${elapsed}ms: ${detail}`);
      throw new Error(`Ollama chat failed: ${detail}`);
    }
  }
}
