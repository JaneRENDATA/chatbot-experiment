import { Injectable } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';
import { Response } from 'express';

@Injectable()
export class ChatService {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  async chatWithAI(messages: any[]) {
    return this.deepSeekService.chat(messages);
  }

  async streamWithAI(body: any, res: Response) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.body) {
      res.write('data: {"error": "No response body from DeepSeek API"}\n\n');
      res.end();
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          res.write(line + '\n\n');
        }
      }
    }
    res.end();
  }
} 