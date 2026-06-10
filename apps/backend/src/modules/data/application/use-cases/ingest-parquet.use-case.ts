import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DuckDBService } from '../../infrastructure/duckdb/duckdb.service';

@Injectable()
export class IngestParquetUseCase {
  constructor(private duckdbService: DuckDBService) {}

  async execute(
    conversationId: string,
    userId: string,
    fileName: string,
    chunks: Buffer[],
  ): Promise<{
    conversationId: string;
    tableName: string;
    columns: string[];
    rowCount: number;
  }> {
    const parquetBuffer = Buffer.concat(chunks);

    await this.duckdbService.createConversation(
      conversationId,
      userId,
      fileName,
      parquetBuffer,
    );

    this.ensureTempDir();
    const tempPath = this.getTempPath(conversationId, fileName);
    fs.writeFileSync(tempPath, parquetBuffer);

    const tableName = DuckDBService.sanitizeTableName(fileName);
    await this.duckdbService.loadParquetToTable(tableName, tempPath);

    const schema = await this.duckdbService.describeTable(tableName);
    const columns = schema.map((col) => col.column_name);

    const rowCount = await this.duckdbService.getRowCount(tableName);

    return {
      conversationId,
      tableName,
      columns,
      rowCount,
    };
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
