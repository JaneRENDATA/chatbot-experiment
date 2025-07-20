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
  position: string;
  question: string;
  answer: string;
  horizontal_prompts: string[];
  vertical_prompts: string[];
}

// 简单Jaro-Winkler相似度实现（0~1）
function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const m = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  let matches = 0, transpositions = 0;
  const s1Matches = Array(s1.length).fill(false);
  const s2Matches = Array(s2.length).fill(false);
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  transpositions /= 2;
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions) / matches) / 3;
  // Jaro-Winkler prefix boost
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

@Injectable()
export class ChatService {
  constructor(private readonly deepSeekService: DeepSeekService) {
  }

  // 防御式normalize，兼容undefined
  private normalize(str: string | undefined): string {
    return (str || '').toLowerCase().replace(/\s+/g, '').trim();
  }

  // Always load rules from YAML for every request
  private getRules(): FlatRule[] {
    const filePath = path.join(__dirname, 'rules', 'rule-based.yaml');
    const raw = fs.readFileSync(filePath, 'utf8');
    return yaml.load(raw) as FlatRule[];
  }

  // 查找知识点，支持归一化匹配question和position，Jaro-Winkler相似度>=0.95
  private findRule(input: string): FlatRule | undefined {
    const rules = this.getRules();
    const normInput = this.normalize(input);
    let best: {rule: FlatRule, score: number} | null = null;
    for (const rule of rules) {
      const qScore = jaroWinkler(this.normalize(rule.question), normInput);
      if (!best || qScore > best.score) best = {rule, score: qScore};
      const pScore = jaroWinkler(this.normalize(rule.position), normInput);
      if (pScore > best.score) best = {rule, score: pScore};
    }
    return best && best.score >= 0.95 ? best.rule : undefined;
  }

  public matchRuleFlat(input: string, mode: 'horizontal' | 'vertical' | 'mixed' = 'horizontal', mixedStep?: number): { content: string; prompts: string[] } | null {
    const rules = this.getRules();
    const rule = this.findRule(input);
    if (!rule) return null;
    let promptIds: string[] = [];
    if (mode === 'mixed' && typeof mixedStep === 'number') {
      const isOdd = mixedStep % 2 === 1;
      const cross = rule.horizontal_prompts.slice(0, isOdd ? 3 : 2);
      const inDepth = rule.vertical_prompts.slice(0, isOdd ? 2 : 3);
      promptIds = [...cross, ...inDepth];
    } else {
      promptIds = mode === 'horizontal' ? rule.horizontal_prompts : rule.vertical_prompts;
    }
    const prompts = promptIds
      .map(id => {
        const foundRule = rules.find(r => r.id === Number(id));
        if (!foundRule) return null;
        // Extract only the numeric part of position (e.g., "3.1.1.1 Integer operations" -> "3.1.1.1")
        const numericPosition = foundRule.position.match(/^[\d.]+/)?.[0] || foundRule.position;
        // Return format: "position question" (e.g., "3.1.1.1 How are integers used in Python...")
        return `${numericPosition} ${foundRule.question}`;
      })
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

  async chatWithRuleOrLLM(messages: any[], step: number, recommendMode: 'horizontal' | 'vertical' | 'mixed' = 'horizontal', mixedStep?: number) {
    const rules = this.getRules();
    const userInput = messages[messages.length - 1]?.content || '';
    const ruleResult = this.matchRuleFlat(userInput, recommendMode, mixedStep);
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

    // First, analyze the user's question to determine its topic/section
    const analysisPrompt = `Analyze this Python question and determine which section of the Python tutorial it belongs to. Use this exact mapping:

3.1.1 - Numbers and arithmetic operations
  Examples: Integer operations, Float operations, Division types, Modulo operator, Power operator

3.1.2 - Strings and text processing  
  Examples: String literals, String concatenation, String indexing, String slicing, String length, String immutability

3.1.3 - Lists and list operations
  Examples: List creation, List indexing, List slicing, List concatenation, List modification, List nesting, List length

4.1 - Conditional statements (if/elif/else)
  Examples: Basic if syntax, elif clause, else clause, Comparison operators

4.2 - For loops and iteration
  Examples: Basic for loop syntax, Iterating over sequences, Loop variables, Nested loops

4.3 - Range function
  Examples: range with one argument, range with start and stop, range with step

4.4 - Loop control (break/continue)
  Examples: break statement usage, continue statement usage

4.8 - Functions
  Examples: Function definition syntax, Parameters, Return statement, Function calls, Scope rules

4.9 - Function arguments
  Examples: Setting default values, Optional arguments, Named arguments, Argument order

5.1 - Lists as stacks and queues
  Examples: append() method, pop() method, LIFO principle, collections.deque, FIFO principle

5.2 - List and variable deletion
  Examples: Deleting list elements, Deleting variables

5.3 - Tuples
  Examples: Tuple creation, Tuple packing, Tuple unpacking, Tuple immutability

5.4 - Sets
  Examples: Set creation, Set operations, Set comprehensions, Set methods

5.5 - Dictionaries
  Examples: Dictionary creation, Key-value pairs, Accessing values, Adding/updating entries, Removing entries

5.6 - Dictionary and sequence utilities
  Examples: items(), enumerate(), zip(), sorted()

7.1 - String formatting
  Examples: f-string syntax, Expression evaluation, Format specifiers, Basic formatting, Positional formatting

7.2 - File input/output
  Examples: open() function, read() methods, write() methods, close() method, with statement

8.1 - Error handling basics
  Examples: Syntax error identification, Error messages interpretation

8.2 - Exception types
  Examples: Common exception types, Exception hierarchy, Exception messages

8.3 - Exception handling
  Examples: try-except blocks, Multiple except clauses, else clause, finally clause

Question: "${userInput}"

Respond with ONLY the section number (e.g., 3.1.1, 3.1.2, 4.1, 4.2, 5.1, 7.2, 8.1, etc.):`;
    
    const analysisMessages = [
      { role: 'user', content: analysisPrompt }
    ];
    const analysisResult = await this.chatWithAI(analysisMessages);
    const sectionNumber = analysisResult.choices[0].message.content.trim();
    
    // Find a rule that matches the identified section
    const matchingRule = rules.find(r => r.position.startsWith(sectionNumber));
    
    if (matchingRule) {
      // Use the existing rule's recommendations based on the mode
      let promptIds: string[] = [];
      if (recommendMode === 'mixed' && typeof mixedStep === 'number') {
        const isOdd = mixedStep % 2 === 1;
        const cross = matchingRule.horizontal_prompts.slice(0, isOdd ? 3 : 2);
        const inDepth = matchingRule.vertical_prompts.slice(0, isOdd ? 2 : 3);
        promptIds = [...cross, ...inDepth];
      } else {
        promptIds = recommendMode === 'horizontal' ? matchingRule.horizontal_prompts : matchingRule.vertical_prompts;
      }
      
      const prompts = promptIds
        .map(id => {
          const foundRule = rules.find(r => r.id === Number(id));
          if (!foundRule) return null;
          const numericPosition = foundRule.position.match(/^[\d.]+/)?.[0] || foundRule.position;
          return `${numericPosition} ${foundRule.question}`;
        })
        .filter(Boolean) as string[];
      
      // Ensure we have exactly 5 prompts
      while (prompts.length < 5) {
        prompts.push('');
      }
      const selectedPrompts = prompts.slice(0, 5);
      
      // Now provide the main answer to the user's question
      const answerPrompt = `Please provide a helpful answer to this Python question. Focus on being clear and educational:

Question: "${userInput}"

Answer:`;
      const llmMessages = [
        ...messages,
        { role: 'user', content: answerPrompt }
      ];
      const llmResult = await this.chatWithAI(llmMessages);
      const contentRaw = llmResult.choices[0].message.content;
      
      const content = contentRaw.trim();
      return {
        choices: [
          {
            message: {
              content,
              prompts: selectedPrompts,
              source: "llm"
            }
          }
        ]
      };
    } else {
      // Fallback: if no matching rule found, use random recommendations
      const allRules = rules.sort(() => 0.5 - Math.random());
      const selectedPrompts = allRules.slice(0, 5).map(rule => {
        const numericPosition = rule.position.match(/^[\d.]+/)?.[0] || rule.position;
        return `${numericPosition} ${rule.question}`;
      });
      
      const answerPrompt = `Please provide a helpful answer to this Python question. Focus on being clear and educational:

Question: "${userInput}"

Answer:`;
      const llmMessages = [
        ...messages,
        { role: 'user', content: answerPrompt }
      ];
      const llmResult = await this.chatWithAI(llmMessages);
      const contentRaw = llmResult.choices[0].message.content;
      
      const content = contentRaw.trim();
      return {
        choices: [
          {
            message: {
              content,
              prompts: selectedPrompts,
              source: "llm"
            }
          }
        ]
      };
    }
  }
} 