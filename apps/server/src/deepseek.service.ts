import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DeepSeekService {
  async chat(messages: any[]) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY);
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }
} 