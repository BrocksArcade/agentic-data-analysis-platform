import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { DuckDBService } from '../../infrastructure/duckdb/duckdb.service';
import { SessionMemory } from '@platform/shared';

@Injectable()
export class LoadConversationUseCase {
  constructor(private duckdbService: DuckDBService) {}

  async execute(
    conversationId: string,
    userId: string,
  ): Promise<SessionMemory> {
    const conversation =
      await this.duckdbService.getConversation(conversationId);

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    this.ensureTempDir();
    const tempPath = this.getTempPath(conversationId, conversation.file_name);
    const fileData = conversation.parquet_file;
    const fileBuffer = this.toBuffer(fileData);
    if (fileBuffer.length === 0) {
      throw new Error(
        `Conversation ${conversationId} has an empty/corrupt data blob`,
      );
    }
    fs.writeFileSync(tempPath, fileBuffer);

    const tableName = DuckDBService.sanitizeTableName(conversation.file_name);
    await this.duckdbService.loadParquetToTable(tableName, tempPath);

    const columnMappings: any[] = [];
    const knownFacts: string[] = [];
    const userPreferences: string[] = [];

    if (conversation.summary) {
      const parsed = this.parseSummary(conversation.summary);
      columnMappings.push(...parsed.columnMappings);
      knownFacts.push(...parsed.knownFacts);
      userPreferences.push(...parsed.userPreferences);
    }

    return {
      conversationId,
      userId,
      tableName,
      fileName: conversation.file_name,
      columnMappings,
      knownFacts,
      userPreferences,
      messages: [],
    };
  }

  private parseSummary(summary: string): {
    columnMappings: any[];
    knownFacts: string[];
    userPreferences: string[];
  } {
    // Parse structured summary text to extract metadata
    const columnMappings: any[] = [];
    const knownFacts: string[] = [];
    const userPreferences: string[] = [];

    const lines = summary.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (
        line.includes('Column Mappings:') ||
        line.includes('COLUMN MAPPINGS')
      ) {
        currentSection = 'mappings';
      } else if (
        line.includes('Known Facts:') ||
        line.includes('KNOWN FACTS')
      ) {
        currentSection = 'facts';
      } else if (
        line.includes('User Preferences:') ||
        line.includes('USER PREFERENCES')
      ) {
        currentSection = 'preferences';
      } else if (line.trim() && currentSection) {
        if (currentSection === 'mappings' && line.includes('=')) {
          const [userTerm, actualColumn] = line
            .split('=')
            .map((s) => s.trim());
          columnMappings.push({ userTerm, actualColumn });
        } else if (currentSection === 'facts') {
          knownFacts.push(line.trim());
        } else if (currentSection === 'preferences') {
          userPreferences.push(line.trim());
        }
      }
    }

    return { columnMappings, knownFacts, userPreferences };
  }

  /**
   * Reconstruct a Buffer from whatever shape the DuckDB BLOB comes back as.
   * DuckDBService.sanitize() JSON-round-trips every row, so a Node Buffer is
   * serialized to `{ type: 'Buffer', data: [...] }` and a Uint8Array to a
   * plain `{ '0': n, '1': n, ... }` object. Handle all of these.
   */
  private toBuffer(fileData: any): Buffer {
    if (Buffer.isBuffer(fileData)) return fileData;
    if (fileData instanceof Uint8Array) return Buffer.from(fileData);
    if (
      fileData &&
      fileData.type === 'Buffer' &&
      Array.isArray(fileData.data)
    ) {
      return Buffer.from(fileData.data);
    }
    if (fileData && typeof fileData === 'object') {
      return Buffer.from(Object.values(fileData) as number[]);
    }
    return Buffer.alloc(0);
  }

  private ensureTempDir() {
    const tempDir = process.env.PARQUET_TEMP_DIR || './tmp/parquet';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  private getTempPath(conversationId: string, fileName: string): string {
    const tempDir = process.env.PARQUET_TEMP_DIR || './tmp/parquet';
    const ext = fileName.toLowerCase().endsWith('.csv') ? '.csv' : '.parquet';
    return `${tempDir}/${conversationId}${ext}`;
  }
}
