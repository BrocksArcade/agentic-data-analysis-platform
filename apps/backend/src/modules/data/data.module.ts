import { Module, forwardRef } from '@nestjs/common';
import { DuckDBService } from './infrastructure/duckdb/duckdb.service';
import { IngestParquetUseCase } from './application/use-cases/ingest-parquet.use-case';
import { LoadConversationUseCase } from './application/use-cases/load-conversation.use-case';
import { MainGateway } from './infrastructure/gateway/main.gateway';
import { AgentModule } from '../agent/agent.module';

@Module({
  providers: [
    DuckDBService,
    IngestParquetUseCase,
    LoadConversationUseCase,
  ],
  exports: [
    DuckDBService,
    IngestParquetUseCase,
    LoadConversationUseCase,
  ],
})
export class DataCoreModule {}

@Module({
  imports: [DataCoreModule, forwardRef(() => AgentModule)],
  providers: [MainGateway],
  exports: [MainGateway],
})
export class DataModule {}
