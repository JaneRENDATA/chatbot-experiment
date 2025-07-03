import { Injectable } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';

@Injectable()
export class ChatService {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  async chatWithAI(messages: any[]) {
    return this.deepSeekService.chat(messages);
  }
} 