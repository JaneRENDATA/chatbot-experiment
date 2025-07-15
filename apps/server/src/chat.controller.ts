import { Controller, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';

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

  @Post('stream')
  async stream(@Body() body: any, @Res() res: Response) {
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new HttpException('Messages array is required', HttpStatus.BAD_REQUEST);
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    await this.chatService.streamWithAI(body, res);
  }
} 