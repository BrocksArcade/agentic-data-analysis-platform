import { Module, forwardRef } from '@nestjs/common';
import { OllamaService } from './infrastructure/ollama/ollama.service';
import { PromptBuilderService } from './infrastructure/prompt/prompt-builder.service';
import { ToolsRegistry } from './infrastructure/tools/tools.registry';
import { DescribeSchemaTool } from './infrastructure/tools/describe-schema.tool';
import { SampleDataTool } from './infrastructure/tools/sample-data.tool';
import { GetRowCountTool } from './infrastructure/tools/get-row-count.tool';
import { RunSqlTool } from './infrastructure/tools/run-sql.tool';
import { RememberMappingTool } from './infrastructure/tools/remember-mapping.tool';
import { RememberFactTool } from './infrastructure/tools/remember-fact.tool';
import { FinalAnswerTool } from './infrastructure/tools/final-answer.tool';
import { SubmitDataTool } from './infrastructure/tools/submit-data.tool';
import { GenerateSummaryUseCase } from './application/use-cases/generate-summary.use-case';
import { RunAgentLoopUseCase } from './application/use-cases/run-agent-loop.use-case';
import { ChartMapperService } from './application/services/chart-mapper.service';
import { DataCoreModule } from '../data/data.module';

@Module({
  imports: [forwardRef(() => DataCoreModule)],
  providers: [
    OllamaService,
    PromptBuilderService,
    DescribeSchemaTool,
    SampleDataTool,
    GetRowCountTool,
    RunSqlTool,
    RememberMappingTool,
    RememberFactTool,
    FinalAnswerTool,
    SubmitDataTool,
    ToolsRegistry,
    GenerateSummaryUseCase,
    ChartMapperService,
    RunAgentLoopUseCase,
  ],
  exports: [
    OllamaService,
    PromptBuilderService,
    ToolsRegistry,
    GenerateSummaryUseCase,
    RunAgentLoopUseCase,
  ],
})
export class AgentModule {}
