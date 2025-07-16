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
  constructor(private readonly deepSeekService: DeepSeekService) {
  }

  // 辅助：归一化字符串，去除标点、全小写、去多余空格
  private normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  // Always load rules from YAML for every request
  private getRules(): FlatRule[] {
    const filePath = path.join(__dirname, 'rules', 'rule-based.yaml');
    const raw = fs.readFileSync(filePath, 'utf8');
    return yaml.load(raw) as FlatRule[];
  }

  // 查找知识点，支持归一化精确匹配
  private findRule(input: string): FlatRule | undefined {
    const rules = this.getRules();
    const normInput = this.normalize(input);
    return rules.find(rule =>
      this.normalize(rule.question) === normInput ||
      this.normalize(rule.topic) === normInput
    );
  }

  public matchRuleFlat(input: string, mode: 'horizontal' | 'vertical' = 'horizontal'): { content: string; prompts: string[] } | null {
    const rules = this.getRules();
    const rule = this.findRule(input);
    if (!rule) return null;
    // prompts 是 id 数组，转成 question
    const promptIds = mode === 'horizontal' ? rule.horizontal_prompts : rule.vertical_prompts;
    const prompts = promptIds
      .map(id => rules.find(r => r.id === Number(id))?.question)
      .filter(Boolean) as string[];
    return {
      content: rule.answer,
      prompts
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
    const rules = this.getRules();
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

    // 区分 horizontal/vertical，但不在 system prompt 里体现，而是追加一条 user 指令
    const recommendInstruction = recommendMode === 'horizontal'
      ? `Please provide 3 cross-topic (related but different topics) recommended questions in the following format, each on a new line. Each question should be no more than 80 characters:
Suggestion 1: <your first suggested question>
Suggestion 2: <your second suggested question>
Suggestion 3: <your third suggested question>`
      : `Please provide 3 in-depth (follow-up or deeper questions on the same topic) recommended questions in the following format, each on a new line. Each question should be no more than 80 characters:
Suggestion 1: <your first suggested question>
Suggestion 2: <your second suggested question>
Suggestion 3: <your third suggested question>`;
    const llmMessages = [
      ...messages,
      { role: 'user', content: recommendInstruction }
    ];
    const llmResult = await this.chatWithAI(llmMessages);
    const contentRaw = llmResult.choices[0].message.content;
    // 用正则提取三条建议
    const promptMatches = Array.from(contentRaw.matchAll(/Suggestion \d+:\s*(.+)/g)) as RegExpMatchArray[];
    const prompts = promptMatches.map(m => m[1].trim()).slice(0, 3);
    while (prompts.length < 3) prompts.push('');
    // answer 内容为 Suggestion 1: 之前的部分
    const suggestionIndex = contentRaw.search(/Suggestion 1:/);
    const content = suggestionIndex > 0 ? contentRaw.slice(0, suggestionIndex).trim() : contentRaw.trim();
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