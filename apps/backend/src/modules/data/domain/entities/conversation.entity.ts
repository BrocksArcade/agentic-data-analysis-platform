export class ConversationEntity {
  conversationId!: string;
  userId!: string;
  fileName!: string;
  parquetFile!: Buffer;
  summary?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<ConversationEntity> = {}) {
    Object.assign(this, partial);
  }
}
