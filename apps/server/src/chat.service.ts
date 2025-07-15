import { Injectable } from '@nestjs/common';
import { DeepSeekService } from './deepseek.service';
import { Response } from 'express';

// 多层级规则树类型
interface RuleNode {
  pattern: RegExp;
  response: string;
  prompts: { text: string; next?: RuleNode }[];
}

@Injectable()
export class ChatService {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  public pythonLearningRoot: RuleNode = {
    pattern: /(learn python|python beginner|python basics|how to learn python|python tutorial)/i,
    response: "Welcome to learning Python! Python is a simple, powerful programming language that's great for beginners.",
    prompts: [
      {
        text: "What are the common data types in Python?",
        next: {
          pattern: /data types?/i,
          response: "Common Python data types include: int, float, str, list, tuple, dict, and set.",
          prompts: [
            {
              text: "What's the difference between a list and a tuple?",
              next: {
                pattern: /list.*tuple|tuple.*list/i,
                response: "A list is mutable, whereas a tuple is immutable. Lists use [ ], tuples use ( ).",
                prompts: [
                  {
                    text: "How do you create a list in Python?",
                    next: {
                      pattern: /create.*list|list.*create/i,
                      response: "You can create a list using square brackets, e.g., my_list = [1, 2, 3]",
                      prompts: [
                        {
                          text: "How do you add an item to a list?",
                          next: {
                            pattern: /add.*item.*list|list.*add.*item/i,
                            response: "You can add an item to a list using the append() method, e.g., my_list.append(4)",
                            prompts: [
                              { text: "How do you remove an item from a list?" },
                              { text: "How do you get the length of a list?" },
                              { text: "How do you sort a list?" }
                            ]
                          }
                        },
                        { text: "How do you remove an item from a list?" },
                        { text: "How do you get the length of a list?" }
                      ]
                    }
                  },
                  {
                    text: "How do you convert a list to a tuple?",
                    next: {
                      pattern: /convert.*list.*tuple|list.*to.*tuple/i,
                      response: "You can convert a list to a tuple using tuple(my_list)",
                      prompts: [
                        { text: "How do you convert a tuple to a list?" },
                        { text: "What are the advantages of tuples?" },
                        { text: "Can a tuple contain a list?" }
                      ]
                    }
                  },
                  {
                    text: "When should you use a tuple instead of a list?",
                    next: {
                      pattern: /use.*tuple.*instead.*list|tuple.*vs.*list/i,
                      response: "Use a tuple when you need an immutable sequence of items.",
                      prompts: [
                        { text: "What is immutability in Python?" },
                        { text: "How do you check if a tuple is immutable?" },
                        { text: "Can you change a tuple after creation?" }
                      ]
                    }
                  }
                ]
              }
            },
            {
              text: "How do you iterate over a dict?",
              next: {
                pattern: /iterate.*dict|dict.*iterate/i,
                response: "You can iterate over a dict using a for loop: for key, value in my_dict.items(): ...",
                prompts: [
                  {
                    text: "How do you get all the keys in a dict?",
                    next: {
                      pattern: /get.*keys.*dict|dict.*keys/i,
                      response: "Use my_dict.keys() to get all the keys in a dict.",
                      prompts: [
                        { text: "How do you get all the values in a dict?" },
                        { text: "How do you check if a key exists in a dict?" },
                        { text: "How do you remove a key from a dict?" }
                      ]
                    }
                  },
                  { text: "How do you check if a key exists in a dict?" },
                  { text: "How do you remove a key from a dict?" }
                ]
              }
            },
            {
              text: "How can I check a variable's type?",
              next: {
                pattern: /check.*type|type.*check/i,
                response: "Use the type() function: type(variable)",
                prompts: [
                  {
                    text: "How do you check if a variable is a string?",
                    next: {
                      pattern: /check.*string|string.*check/i,
                      response: "Use isinstance(variable, str) to check if a variable is a string.",
                      prompts: [
                        { text: "How do you check if a variable is a number?" },
                        { text: "How do you check if a variable is a list?" },
                        { text: "How do you check if a variable is None?" }
                      ]
                    }
                  },
                  { text: "How do you check if a variable is a list?" },
                  { text: "How do you check if a variable is None?" }
                ]
              }
            }
          ]
        }
      },
      {
        text: "How do I write a Hello World in Python?",
        next: {
          pattern: /hello world/i,
          response: "You can write a Hello World in Python like this:\n```python\nprint('Hello World')\n```",
          prompts: [
            {
              text: "How do you define a variable in Python?",
              next: {
                pattern: /define.*variable|variable.*define/i,
                response: "You define a variable by assigning a value: x = 5",
                prompts: [
                  { text: "How do you change a variable's value?" },
                  { text: "What are variable naming rules in Python?" },
                  { text: "Can variable names start with a number?" }
                ]
              }
            },
            { text: "How do you take input and output in Python?" },
            { text: "How do you write multi-line comments?" }
          ]
        }
      },
      {
        text: "How does the for loop work in Python?",
        next: {
          pattern: /for loop/i,
          response: "A for loop in Python looks like this:\n```python\nfor i in range(5):\n    print(i)\n```",
          prompts: [
            {
              text: "What are the uses of range()?",
              next: {
                pattern: /uses.*range|range.*uses/i,
                response: "range() is used to generate a sequence of numbers, often used in for loops.",
                prompts: [
                  { text: "How do you use range() with a step?" },
                  { text: "How do you use range() to count down?" },
                  { text: "Can you use range() with floats?" }
                ]
              }
            },
            { text: "How do you loop through a list?" },
            { text: "How do you use nested for loops?" }
          ]
        }
      }
    ]
  };

  public matchRuleTree(input: string, node: RuleNode, step: number): { content: string; prompts: string[] } | null {
    if (step > 5) return null;
    if (node.pattern.test(input)) {
      return {
        content: node.response,
        prompts: node.prompts.map(p => p.text)
      };
    }
    for (const prompt of node.prompts) {
      if (prompt.next) {
        const result = this.matchRuleTree(input, prompt.next, step + 1);
        if (result) return result;
      }
    }
    return null;
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

  async chatWithRuleOrLLM(messages: any[], step: number) {
    const userInput = messages[messages.length - 1]?.content || '';
    const ruleResult = this.matchRuleTree(userInput, this.pythonLearningRoot, step);
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