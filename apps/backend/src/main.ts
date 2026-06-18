import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.setGlobalPrefix('/api');
  app.enableCors();

  const port = process.env.PORT || 3000;
  const dbPath = process.env.DUCKDB_PATH || '/data/main.duckdb';
  await app.listen(port);
  console.log(`Server listening on port ${port}`);
  console.log(`DuckDB file at: ${dbPath}`);
}
bootstrap();
