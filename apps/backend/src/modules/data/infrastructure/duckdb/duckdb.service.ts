import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const Database = require('duckdb').Database;

@Injectable()
export class DuckDBService implements OnModuleInit {
  private db: any;
  private dbPath = process.env.DUCKDB_PATH || '/data/main.duckdb';

  async onModuleInit() {
    this.ensureDataDir();
    this.db = new Database(this.dbPath);
    this.initializeSchema();
  }

  private ensureDataDir() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private initializeSchema() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          conversation_id VARCHAR PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          file_name VARCHAR NOT NULL,
          parquet_file BLOB NOT NULL,
          summary VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (err: any) {
      console.log('Schema already initialized or error:', err.message);
    }
  }

  private async run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const done = (err: any, res: any) => {
        if (err) reject(err);
        else resolve(this.sanitize(res));
      };
      try {
        if (params && params.length > 0) {
          this.db.all(sql, ...params, done);
        } else {
          this.db.all(sql, done);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  private sanitize(data: any): any {
    return JSON.parse(JSON.stringify(data, (_, v) =>
      typeof v === 'bigint' ? Number(v) : v,
    ));
  }

  async createConversation(
    conversationId: string,
    userId: string,
    fileName: string,
    parquetBuffer: Buffer,
  ): Promise<void> {
    await this.run(
      `
      INSERT INTO conversations
      (conversation_id, user_id, file_name, parquet_file)
      VALUES (?, ?, ?, ?)
      `,
      [conversationId, userId, fileName, parquetBuffer],
    );
  }

  async getConversation(conversationId: string): Promise<any> {
    const result = await this.run(
      `SELECT * FROM conversations WHERE conversation_id = ?`,
      [conversationId],
    );
    return result[0] || null;
  }

  async updateSummary(conversationId: string, summary: string): Promise<void> {
    await this.run(
      `
      UPDATE conversations
      SET summary = ?, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
      `,
      [summary, conversationId],
    );
  }

  static sanitizeTableName(fileName: string): string {
    const base = fileName.replace(/\.[^.]+$/, ''); // strip extension
    const safe = base.replace(/[^a-zA-Z0-9_]/g, '_'); // replace special chars
    return /^\d/.test(safe) ? `t_${safe}` : safe; // prefix if starts with digit
  }

  async loadParquetToTable(tableName: string, tempPath: string): Promise<void> {
    const isCSV = tempPath.toLowerCase().endsWith('.csv');
    const readFn = isCSV
      ? `read_csv_auto('${tempPath}')`
      : `read_parquet('${tempPath}')`;
    await this.run(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM ${readFn}`);
  }

  async describeTable(tableName: string): Promise<any[]> {
    const result = await this.run(`DESCRIBE ${tableName}`);
    return result;
  }

  async sampleData(tableName: string, limit: number): Promise<any[]> {
    const result = await this.run(
      `SELECT * FROM ${tableName} LIMIT ${Math.min(limit, 10)}`,
    );
    return result;
  }

  async getRowCount(tableName: string): Promise<number> {
    const result = await this.run(`SELECT COUNT(*) as count FROM ${tableName}`);
    return Number(result[0].count);
  }

  async executeQuery(
    sql: string,
    tableName: string,
  ): Promise<{ data: any[] } | { error: string }> {
    const blockedKeywords = [
      'DROP',
      'ALTER',
      'DELETE',
      'INSERT',
      'UPDATE',
      'CREATE',
      'ATTACH',
      'COPY',
      'EXPORT',
    ];

    const upperSql = sql.toUpperCase();
    for (const keyword of blockedKeywords) {
      if (upperSql.includes(keyword)) {
        return { error: `Blocked keyword: ${keyword}` };
      }
    }

    if (!sql.toUpperCase().includes(tableName.toUpperCase())) {
      return { error: `Query must reference table ${tableName}` };
    }

    if (!sql.toUpperCase().includes('LIMIT')) {
      sql = sql + ` LIMIT 500`;
    }

    try {
      const result = await this.run(sql);
      if (result && result.length > 500) {
        return { error: 'Result set too large. Use aggregation to reduce output.' };
      }
      return { data: result };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async dropTable(tableName: string): Promise<void> {
    try {
      await this.run(`DROP TABLE IF EXISTS ${tableName}`);
    } catch (err) {
      // Silent fail for cleanup
    }
  }
}
