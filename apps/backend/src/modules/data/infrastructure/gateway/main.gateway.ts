import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SessionMemory } from '@platform/shared';
import { randomUUID } from 'crypto';
import { IngestParquetUseCase } from '../../application/use-cases/ingest-parquet.use-case';
import { LoadConversationUseCase } from '../../application/use-cases/load-conversation.use-case';
import { BuildWidgetUseCase } from '../../application/use-cases/build-widget.use-case';
import { RunAgentLoopUseCase } from '../../../agent/application/use-cases/run-agent-loop.use-case';
import { DuckDBService } from '../duckdb/duckdb.service';
import { describeToSchema } from '../../application/services/column-kind.util';

@WebSocketGateway({ cors: { origin: '*' } })
export class MainGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(MainGateway.name);

  private uploadBuffers = new Map<string, Buffer[]>();
  private sessions = new Map<string, SessionMemory>();

  constructor(
    private ingestParquet: IngestParquetUseCase,
    private loadConversation: LoadConversationUseCase,
    private buildWidget: BuildWidgetUseCase,
    private runAgentLoop: RunAgentLoopUseCase,
    private duckdbService: DuckDBService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`[CONNECT] client=${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[DISCONNECT] client=${client.id}`);
    this.uploadBuffers.delete(client.id);
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('upload:start')
  async handleUploadStart(
    client: Socket,
    payload: {
      conversationId: string;
      userId: string;
      fileName: string;
      totalChunks: number;
      fileSize: number;
    },
  ) {
    this.logger.log(
      `[UPLOAD:START] convId=${payload.conversationId} file=${payload.fileName} totalChunks=${payload.totalChunks} size=${payload.fileSize}`,
    );
    try {
      this.uploadBuffers.set(payload.conversationId, []);
      client.emit('upload:progress', {
        percent: 0,
        chunksReceived: 0,
        totalChunks: payload.totalChunks,
      });
    } catch (err: any) {
      this.logger.error(`[UPLOAD:START] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('upload:error', { message: err.message });
    }
  }

  @SubscribeMessage('upload:chunk')
  async handleUploadChunk(
    client: Socket,
    payload: { conversationId: string; data: ArrayBuffer },
  ) {
    try {
      const chunks = this.uploadBuffers.get(payload.conversationId);
      if (!chunks) {
        this.logger.warn(
          `[UPLOAD:CHUNK] no buffer for convId=${payload.conversationId} — upload:start was never received`,
        );
        client.emit('upload:error', { message: 'Upload not initialised. Send upload:start first.' });
        return;
      }
      chunks.push(Buffer.from(payload.data));
      this.logger.debug(
        `[UPLOAD:CHUNK] convId=${payload.conversationId} chunk=${chunks.length} bytes=${Buffer.from(payload.data).length}`,
      );
      client.emit('upload:progress', {
        percent: Math.min(chunks.length * 10, 99),
        chunksReceived: chunks.length,
      });
    } catch (err: any) {
      this.logger.error(`[UPLOAD:CHUNK] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('upload:error', { message: err.message });
    }
  }

  @SubscribeMessage('upload:complete')
  async handleUploadComplete(
    client: Socket,
    payload: {
      conversationId: string;
      userId: string;
      fileName: string;
    },
  ) {
    const chunks = this.uploadBuffers.get(payload.conversationId) || [];
    this.logger.log(
      `[UPLOAD:COMPLETE] convId=${payload.conversationId} file=${payload.fileName} totalChunks=${chunks.length} totalBytes=${chunks.reduce((s, c) => s + c.length, 0)}`,
    );
    try {
      const result = await this.ingestParquet.execute(
        payload.conversationId,
        payload.userId,
        payload.fileName,
        chunks,
      );
      this.logger.log(
        `[UPLOAD:COMPLETE] ingested table=${result.tableName} columns=${result.columns.join(',')} rows=${result.rowCount}`,
      );

      const session: SessionMemory = {
        conversationId: payload.conversationId,
        userId: payload.userId,
        tableName: result.tableName,
        fileName: payload.fileName,
        columnMappings: [],
        knownFacts: [],
        userPreferences: [],
        messages: [],
      };

      this.sessions.set(payload.conversationId, session);
      this.logger.log(`[UPLOAD:COMPLETE] session created convId=${payload.conversationId}`);

      const describeRows = await this.duckdbService.describeTable(result.tableName);
      const schema = describeToSchema(describeRows);

      client.emit('upload:ready', {
        conversationId: payload.conversationId,
        tableName: result.tableName,
        columns: result.columns,
        rowCount: result.rowCount,
        schema,
      });

      this.uploadBuffers.delete(payload.conversationId);
    } catch (err: any) {
      this.logger.error(`[UPLOAD:COMPLETE] ERROR convId=${payload.conversationId} err=${err.message}`, err.stack);
      client.emit('upload:error', { message: err.message });
    }
  }

  @SubscribeMessage('conversation:open')
  async handleConversationOpen(
    client: Socket,
    payload: { conversationId: string; userId: string },
  ) {
    this.logger.log(`[CONVERSATION:OPEN] convId=${payload.conversationId}`);
    try {
      const session = await this.loadConversation.execute(
        payload.conversationId,
        payload.userId,
      );

      this.sessions.set(payload.conversationId, session);

      const conversation = await this.duckdbService.getConversation(
        payload.conversationId,
      );

      const describeRows = await this.duckdbService.describeTable(session.tableName);
      const schema = describeToSchema(describeRows);

      this.logger.log(`[CONVERSATION:OPEN] loaded convId=${payload.conversationId} file=${conversation.file_name}`);
      client.emit('conversation:loaded', {
        conversationId: payload.conversationId,
        fileName: conversation.file_name,
        summary: conversation.summary || '',
        schema,
      });

      const charts = await this.duckdbService.listCharts(payload.conversationId);
      client.emit('charts:listed', { charts });
    } catch (err: any) {
      this.logger.error(`[CONVERSATION:OPEN] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('upload:error', { message: err.message });
    }
  }

  @SubscribeMessage('agent:query')
  async handleAgentQuery(
    client: Socket,
    payload: { conversationId: string; userId: string; question: string },
  ) {
    this.logger.log(
      `[AGENT:QUERY] convId=${payload.conversationId} question="${payload.question}"`,
    );
    try {
      const session = this.sessions.get(payload.conversationId);
      if (!session) {
        this.logger.warn(
          `[AGENT:QUERY] no session for convId=${payload.conversationId} — active sessions: [${Array.from(this.sessions.keys()).join(', ')}]`,
        );
        return client.emit('agent:error', {
          message: 'Conversation not loaded',
        });
      }
      this.logger.log(`[AGENT:QUERY] session found table=${session.tableName}`);

      const conversation = await this.duckdbService.getConversation(
        payload.conversationId,
      );

      const result = await this.runAgentLoop.execute(
        session,
        payload.question,
        conversation?.summary,
        (action: string, iteration: number) => {
          this.logger.debug(`[AGENT:THINKING] convId=${payload.conversationId} iter=${iteration} action=${action}`);
          client.emit('agent:thinking', { action, iteration });
        },
      );

      this.logger.log(`[AGENT:QUERY] result ready convId=${payload.conversationId}`);
      client.emit('agent:result', result);
    } catch (err: any) {
      this.logger.error(`[AGENT:QUERY] ERROR convId=${payload.conversationId} err=${err.message}`, err.stack);
      client.emit('agent:error', { message: err.message });
    }
  }

  @SubscribeMessage('conversations:list')
  async handleConversationsList(
    client: Socket,
    payload: { userId: string },
  ) {
    this.logger.log(`[CONVERSATIONS:LIST] userId=${payload.userId}`);
    try {
      const conversations = await this.duckdbService.listConversations(payload.userId);
      client.emit('conversations:listed', {
        conversations: conversations.map((c) => ({
          conversationId: c.conversation_id,
          fileName: c.file_name,
          createdAt: c.created_at,
        })),
      });
    } catch (err: any) {
      this.logger.error(`[CONVERSATIONS:LIST] ERROR userId=${payload.userId} err=${err.message}`);
      client.emit('conversations:list:error', { message: err.message });
    }
  }

  @SubscribeMessage('widget:build')
  async handleWidgetBuild(
    client: Socket,
    payload: { conversationId: string; spec: any },
  ) {
    this.logger.log(`[WIDGET:BUILD] convId=${payload.conversationId} chartType=${payload.spec.chartType}`);
    try {
      const session = this.sessions.get(payload.conversationId);
      if (!session) {
        this.logger.warn(`[WIDGET:BUILD] no session for convId=${payload.conversationId}`);
        return client.emit('widget:error', {
          message: 'Conversation not loaded',
          spec: payload.spec,
        });
      }

      const chart = await this.buildWidget.execute(session.tableName, payload.spec);
      client.emit('widget:built', { spec: payload.spec, chart });
    } catch (err: any) {
      this.logger.error(`[WIDGET:BUILD] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('widget:error', {
        message: err.message,
        spec: payload.spec,
      });
    }
  }

  @SubscribeMessage('chart:save')
  async handleChartSave(
    client: Socket,
    payload: { conversationId: string; userId: string; chart: any },
  ) {
    this.logger.log(`[CHART:SAVE] convId=${payload.conversationId}`);
    try {
      const chartId = randomUUID();
      await this.duckdbService.createChart({
        chartId,
        conversationId: payload.conversationId,
        userId: payload.userId,
        chartType: payload.chart.chartType,
        title: payload.chart.title,
        source: payload.chart.source,
        config: payload.chart.config,
        contract: payload.chart.contract,
      });
      client.emit('chart:saved', { chartId });
    } catch (err: any) {
      this.logger.error(`[CHART:SAVE] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('chart:save:error', { message: err.message });
    }
  }

  @SubscribeMessage('charts:list')
  async handleChartsList(
    client: Socket,
    payload: { conversationId: string },
  ) {
    this.logger.log(`[CHARTS:LIST] convId=${payload.conversationId}`);
    try {
      const charts = await this.duckdbService.listCharts(payload.conversationId);
      client.emit('charts:listed', {
        charts: charts.map((c) => ({
          chartId: c.chart_id,
          chartType: c.chart_type,
          title: c.title,
          source: c.source,
          config: c.config,
          contract: c.contract,
        })),
      });
    } catch (err: any) {
      this.logger.error(`[CHARTS:LIST] ERROR convId=${payload.conversationId} err=${err.message}`);
      client.emit('charts:list:error', { message: err.message });
    }
  }

  @SubscribeMessage('chart:delete')
  async handleChartDelete(
    client: Socket,
    payload: { chartId: string },
  ) {
    this.logger.log(`[CHART:DELETE] chartId=${payload.chartId}`);
    try {
      await this.duckdbService.deleteChart(payload.chartId);
      client.emit('chart:deleted', { chartId: payload.chartId });
    } catch (err: any) {
      this.logger.error(`[CHART:DELETE] ERROR chartId=${payload.chartId} err=${err.message}`);
      client.emit('chart:delete:error', { message: err.message });
    }
  }
}
