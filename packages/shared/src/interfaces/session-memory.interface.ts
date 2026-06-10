import { Message } from './message.interface';

export interface ColumnMapping {
  userTerm: string;
  actualColumn: string;
}

export interface SessionMemory {
  conversationId: string;
  userId: string;
  tableName: string;
  fileName: string;
  columnMappings: ColumnMapping[];
  knownFacts: string[];
  userPreferences: string[];
  messages: Message[];
}
