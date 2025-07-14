import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: { messages: any[] }) {
    try {
      if (!body.messages || !Array.isArray(body.messages)) {
        throw new HttpException('Messages array is required', HttpStatus.BAD_REQUEST);
      }
      
      return await this.chatService.chatWithAI(body.messages);
    } catch (error: any) {
      console.error('Chat controller error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 