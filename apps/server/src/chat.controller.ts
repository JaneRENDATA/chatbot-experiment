import { Controller, Post, Body, HttpException, HttpStatus, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: { messages: any[], step?: number }) {
    try {
      if (!body.messages || !Array.isArray(body.messages)) {
        throw new HttpException('Messages array is required', HttpStatus.BAD_REQUEST);
      }
      // 取step参数，默认1
      const step = typeof body.step === 'number' ? body.step : 1;
      return await this.chatService.chatWithRuleOrLLM(body.messages, step);
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
  async stream(@Body() body: any, @Res({ passthrough: false }) res: Response) {
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new HttpException('Messages array is required', HttpStatus.BAD_REQUEST);
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const step = typeof body.step === 'number' ? body.step : 1;
    const userInput = body.messages[body.messages.length - 1]?.content || '';
    // 规则树流式模拟
    const ruleResult = this.chatService.matchRuleTree(userInput, this.chatService.pythonLearningRoot, step);
    if (ruleResult) {
      const text = ruleResult.content;
      for (let i = 0; i < text.length; i++) {
        const chunk = text[i];
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk }, source: 'rule', prompts: ruleResult.prompts }] })}\n\n`);
        await new Promise(r => setTimeout(r, 30));
      }
      res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop', source: 'rule', prompts: ruleResult.prompts }] })}\n\n`);
      res.end();
      return;
    }
    // LLM流式兜底，先获取 prompts 和 source
    const llmResult = await this.chatService.chatWithRuleOrLLM(body.messages, step);
    const prompts = llmResult.choices?.[0]?.message?.prompts || [];
    const source = llmResult.choices?.[0]?.message?.source || 'llm';
    await this.chatService.streamWithAI({ ...body, prompts, source }, res);
    // 注意：streamWithAI 内部已处理 res.end()，此处不能 return/res.end，否则会报错
  }
} 