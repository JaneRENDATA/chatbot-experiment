import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DeepSeekService {
  async chat(messages: any[]) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    
    console.log('DEEPSEEK_API_KEY:', apiKey ? '***' + apiKey.slice(-4) : 'NOT SET');
    
    try {
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
    } catch (error: any) {
      console.error('DeepSeek API error:', error.response?.data || error.message);
      throw new Error(`DeepSeek API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
} 