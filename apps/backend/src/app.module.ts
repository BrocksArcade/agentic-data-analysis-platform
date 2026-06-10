import { Module } from '@nestjs/common';
import { DataModule } from './modules/data/data.module';

@Module({
  imports: [DataModule],
})
export class AppModule {}
