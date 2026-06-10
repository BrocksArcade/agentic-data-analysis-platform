import { Injectable } from '@nestjs/common';
import { Message, SessionMemory } from '@platform/shared';
import { OllamaService } from '../../infrastructure/ollama/ollama.service';
import { DuckDBService } from '../../../data/infrastructure/duckdb/duckdb.service';

@Injectable()
export class GenerateSummaryUseCase {
  constructor(
    private ollamaService: OllamaService,
    private duckdbService: DuckDBService,
  ) {}

  async execute(
    session: SessionMemory,
    messages: Message[],
  ): Promise<string> {
    const summaryPrompt = `You are summarizing a data analysis conversation. Extract and format the following information from the conversation history:

1. Column Mappings (user terms mapped to actual column names)
2. Known Facts (discoveries about the data)
3. User Preferences (stated preferences about how to handle data)
4. Key Findings (important patterns or insights)
5. Any corrections made during the conversation

Format as plain structured text with clear sections. Be concise.`;

    try {
      const summary = await this.ollamaService.chat(
        summaryPrompt,
        messages,
      );

      await this.duckdbService.updateSummary(session.conversationId, summary);
      return summary;
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      return '';
    }
  }
}
