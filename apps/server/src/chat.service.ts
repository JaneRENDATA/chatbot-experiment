import { Injectable } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// 多层级规则树类型
interface RuleNode {
  pattern: RegExp;
  response: string;
  prompts: { text: string; next?: RuleNode }[];
}

interface FlatRule {
  id: number;
  topic: string;
  question: string;
  answer: string;
  horizontal_prompts: string[];
  vertical_prompts: string[];
}

@Injectable()
export class ChatService {
  private rules: FlatRule[] = [];

  constructor(private readonly deepSeekService: DeepSeekService) {
    // 只读取平铺结构的 rule-based.yaml
    const filePath = path.join(__dirname, 'rules', 'rule-based.yaml');
    const raw = fs.readFileSync(filePath, 'utf8');
    this.rules = yaml.load(raw) as FlatRule[];
  }

  // 查找知识点，支持模糊匹配
  private findRule(input: string): FlatRule | undefined {
    input = input.toLowerCase();
    return this.rules.find(rule =>
      rule.question.toLowerCase().includes(input) ||
      rule.topic.toLowerCase().includes(input)
    );
  }

  public matchRuleFlat(input: string, mode: 'horizontal' | 'vertical' = 'horizontal'): { content: string; prompts: string[] } | null {
    const rule = this.findRule(input);
    if (!rule) return null;
    return {
      content: rule.answer,
      prompts: mode === 'horizontal' ? rule.horizontal_prompts : rule.vertical_prompts
    };
  }

  async chatWithAI(messages: any[]) {
    return this.deepSeekService.chat(messages);
  }

  async streamWithAI(body: any, res: Response) {
    // 1. 设置 SSE 头（只设置一次）
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.flushHeaders();
    }
    let clientAborted = false;
    const onClose = () => {
      clientAborted = true;
      try { res.end(); } catch {}
    };
    res.on('close', onClose);
    const t0 = Date.now();
    console.log(`[SSE] fetch to DeepSeek start:`, new Date(t0).toISOString());
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: body.messages,
          stream: true,
        }),
      });
      const t1 = Date.now();
      console.log(`[SSE] DeepSeek responded (headers):`, new Date(t1).toISOString(), `+${t1-t0}ms`);
      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: 'API request failed' })}\n\n`);
        if (typeof (res as any).flush === 'function') (res as any).flush();
        res.end();
        return;
      }
      if (!response.body) {
        res.end();
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstChunk = true;
      while (!clientAborted) {
        const { done, value } = await reader.read();
        if (done) break;
        const t2 = Date.now();
        console.log(`[SSE] DeepSeek chunk received:`, new Date(t2).toISOString(), `+${t2-t0}ms`);
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              const prompts = body.prompts || [];
              const source = body.source || 'llm';
              res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop', prompts, source }] })}\n\n`);
              if (typeof (res as any).flush === 'function') (res as any).flush();
              const t3 = Date.now();
              console.log(`[SSE] [DONE] sent to client:`, new Date(t3).toISOString(), `+${t3-t0}ms`);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                const delta = parsed.choices[0].delta;
                if (delta.content) {
                  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`);
                  if (typeof (res as any).flush === 'function') (res as any).flush();
                  const t4 = Date.now();
                  if (firstChunk) {
                    console.log(`[SSE] First token sent to client:`, new Date(t4).toISOString(), `+${t4-t0}ms`);
                    firstChunk = false;
                  }
                }
                if (parsed.choices[0].finish_reason === 'stop') {
                  const prompts = body.prompts || [];
                  const source = body.source || 'llm';
                  res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop', prompts, source }] })}\n\n`);
                  if (typeof (res as any).flush === 'function') (res as any).flush();
                  const t5 = Date.now();
                  console.log(`[SSE] finish_reason=stop sent to client:`, new Date(t5).toISOString(), `+${t5-t0}ms`);
                  break;
                }
              }
            } catch (err) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
      }
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      if (typeof (res as any).flush === 'function') (res as any).flush();
    } finally {
      if (!clientAborted) {
        res.end();
      }
      res.off('close', onClose);
    }
  }

  async chatWithRuleOrLLM(messages: any[], step: number, recommendMode: 'horizontal' | 'vertical' = 'horizontal') {
    const userInput = messages[messages.length - 1]?.content || '';
    const ruleResult = this.matchRuleFlat(userInput, recommendMode);
    if (ruleResult) {
      return {
        choices: [
          {
            message: {
              content: ruleResult.content,
              prompts: ruleResult.prompts,
              source: "rule"
            }
          }
        ]
      };
    }
    // Step >= 6 or no rule matched, use LLM in English
    const llmPrompt = `Please answer the user's question in no more than 500 English characters, and provide 3 related recommended questions in English, in the following format:\nAnswer content\nSuggestion 1: xxx\nSuggestion 2: xxx\nSuggestion 3: xxx`;
    const llmMessages = [
      ...messages,
      { role: 'system', content: 'You are a Python learning assistant. Please reply in English.' },
      { role: 'user', content: llmPrompt }
    ];
    const llmResult = await this.chatWithAI(llmMessages);
    const lines = llmResult.choices[0].message.content.split('\n').filter(Boolean);
    const content = lines[0];
    const prompts = lines.slice(1, 4).map((line: string) => line.replace(/^Suggestion \d:|^Suggestion \d：/, '').trim());
    return {
      choices: [
        {
          message: {
            content,
            prompts,
            source: "llm"
          }
        }
      ]
    };
  }
} 