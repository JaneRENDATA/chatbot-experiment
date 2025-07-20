'use client';
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable line-comment-position */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useRef, useEffect } from 'react';
import { CHAT_BASE_URL, CHAT_ENDPOINT } from '../../../../libs/shared/config/constants';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

const DEFAULT_PROMPT = 'You are a Python tutor. max 200 characters per response.';

interface IMessage {
  id: number;
  text: string;
  isUser: boolean;
  prompts?: string[]; // Keep as string array for now
  source?: string; // 新增 source 字段
  requestStep?: number; // Store the step used for this request
}

const LOCAL_STORAGE_KEY = 'chatbox_messages_v1';
const PROMPT_STORAGE_KEY = 'chatbox_prompt_v1';

interface ChatboxProps {
  libId?: string | null;
  fileName?: string | null;
  scrapedUrl?: string | null;
  role?: string;
}

interface IChatFlow {
  messages: IMessage[];
  step?: number;
  mixedStep?: number;
}

// 在组件外部添加处理函数
function processLLMText(text: string) {
  const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  let lastIndex = 0;
  let result = '';
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 处理代码块前的普通文本
    const before = text.slice(lastIndex, match.index);
    result += processParagraphs(before);
    // 保留代码块原样
    result += match[0];
    lastIndex = match.index + match[0].length;
  }
  // 处理最后一段普通文本
  result += processParagraphs(text.slice(lastIndex));
  return result;
}
function processParagraphs(str: string) {
  // 1. 合并多于1个的空白行为1个
  let s = str.replace(/(\n[ \t]*){2,}/g, '\n');
  // 2. 去掉所有单独的空白行
  s = s.replace(/(^|[^\n])\n[ \t]*(?!\n)/g, '$1');
  return s;
}

// 定义高阶函数生成 p 组件
function createParagraph(isRule: boolean) {
  return function P({ children }: { children: React.ReactNode }) {
    // 判断是否是空行
    const isEmpty = React.Children.toArray(children).every(
      child => typeof child === 'string' && child.trim() === ''
    );
    if (isEmpty) {
      // 空行，行距为0.8
      return <p style={{ margin: '0', lineHeight: 0.8, minHeight: '1em' }}>{children}</p>;
    }
    // 普通行，rule和LLM都为1.5
    return <p style={{ margin: '0 0 0.2em 0', lineHeight: 1.5 }}>{children}</p>;
  };
}

const Chatbox: React.FC<ChatboxProps> = ({ libId, fileName, scrapedUrl, role }) => {
  // 三种模式独立的聊天流和计数，显式类型
  const [chatFlows, setChatFlows] = useState<Record<'horizontal' | 'vertical' | 'mixed', IChatFlow>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            horizontal: parsed.horizontal || { messages: [], step: 1 },
            vertical: parsed.vertical || { messages: [], step: 1 },
            mixed: parsed.mixed || { messages: [], mixedStep: 1 },
          };
        }
      } catch (error) {
        console.warn('localStorage error:', error);
      }
    }
    return {
      horizontal: { messages: [], step: 1 },
      vertical: { messages: [], step: 1 },
      mixed: { messages: [], mixedStep: 1 },
    };
  });
  const [activeMode, setActiveMode] = useState<'horizontal' | 'vertical' | 'mixed'>('horizontal');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showFollowUpAsText, setShowFollowUpAsText] = useState(false);
  const [prompt, setPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(PROMPT_STORAGE_KEY);
        return saved || DEFAULT_PROMPT;
      } catch {
        return DEFAULT_PROMPT;
      }
    }
    return DEFAULT_PROMPT;
  });
  const [tempPrompt, setTempPrompt] = useState(prompt);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAsText, setShowAsText] = useState(false);
  const [showColors, setShowColors] = useState(true);

  // 聊天记录持久化（可选：可按activeMode分别存储）
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatFlows));
    } catch (error) {
      console.warn('localStorage error:', error);
    }
  }, [chatFlows]);

  // prompt 持久化
  useEffect(() => {
    try {
      localStorage.setItem(PROMPT_STORAGE_KEY, prompt);
    } catch (error) {
      console.warn('localStorage error:', error);
    }
  }, [prompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatFlows, activeMode]);

  // 切换推荐模式Tab时不重置内容，只切换activeMode
  const handleModeChange = (mode: 'horizontal' | 'vertical' | 'mixed') => {
    setActiveMode(mode);
    setInput('');
  };

  // 获取当前模式的聊天流和step
  const currentFlow = chatFlows[activeMode];
  const messages = currentFlow.messages;
  const step = activeMode === 'mixed' ? currentFlow.mixedStep! : currentFlow.step!;

  // 点击推荐 prompt
  const handlePromptClick = (promptText: string) => {
    // Extract only the question part (remove position)
    // Format: "3.1.1.1 How are integers used in Python..." -> "How are integers used in Python..."
    const questionMatch = promptText.match(/^[\d.]+ (.+)$/);
    const questionOnly = questionMatch ? questionMatch[1] : promptText;
    
    setInput(questionOnly);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  // 提交消息，更新当前模式的聊天流和step
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    const userMessage: IMessage = { id: Date.now(), text: input, isUser: true };
    setChatFlows(prev => {
      const flow = { ...prev[activeMode] };
      flow.messages = [...flow.messages, userMessage];
      return { ...prev, [activeMode]: flow };
    });
    setInput('');
    setIsLoading(true);
    setShowLoading(true);
    // 构造请求体
    const payload = {
      messages: [
        { role: 'system', content: prompt },
        ...messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: input }
      ],
      step,
      recommendMode: activeMode,
      ...(activeMode === 'mixed' ? { mixedStep: step } : {})
    };
    const aiMsgId = Date.now() + 1;
    setChatFlows(prev => {
      const flow = { ...prev[activeMode] };
      flow.messages = [...flow.messages, { id: aiMsgId, text: '', isUser: false, requestStep: step }];
      return { ...prev, [activeMode]: flow };
    });
    try {
      const response = await fetch(`${CHAT_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      let prompts: string[] = [];
      let source: string | undefined = undefined;
      let firstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '');
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta;
              if (delta?.content) {
                aiText += delta.content;
                setChatFlows(prev => {
                  const flow = { ...prev[activeMode] };
                  flow.messages = flow.messages.map(msg =>
                    msg.id === aiMsgId ? { ...msg, text: aiText, source: json.choices?.[0]?.source } : msg
                  );
                  return { ...prev, [activeMode]: flow };
                });
                if (firstChunk) {
                  setShowLoading(false);
                  firstChunk = false;
                }
              }
              if (json.choices?.[0]?.finish_reason === 'stop') {
                prompts = json.choices?.[0]?.prompts || [];
                source = json.choices?.[0]?.source;
                setChatFlows(prev => {
                  const flow = { ...prev[activeMode] };
                  flow.messages = flow.messages.map(msg =>
                    msg.id === aiMsgId ? { ...msg, prompts, source } : msg
                  );
                  return { ...prev, [activeMode]: flow };
                });
              }
            } catch (e) {
              console.warn('JSON parse error:', e);
            }
          }
        }
      }
    } catch (error: any) {
      setChatFlows(prev => {
        const flow = { ...prev[activeMode] };
        flow.messages = flow.messages.map(msg =>
          msg.id === aiMsgId ? { ...msg, text: `Error: ${error.message}` } : msg
        );
        return { ...prev, [activeMode]: flow };
      });
      setShowLoading(false);
    } finally {
      setIsLoading(false);
      setShowLoading(false);
      setChatFlows(prev => {
        const flow = { ...prev[activeMode] };
        if (activeMode === 'mixed') {
          flow.mixedStep = (flow.mixedStep || 1) + 1;
        } else {
          flow.step = (flow.step || 1) + 1;
        }
        return { ...prev, [activeMode]: flow };
      });
    }
  };

  const getFollowUpColor = (promptType: 'cross-topic' | 'in-depth') => {
    if (!showColors) {
      // Default blue color when colors are hidden
      return 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300';
    }
    
    return promptType === 'cross-topic'
      ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300';
  };

  const getFollowUpTextColor = (promptType: 'cross-topic' | 'in-depth') => {
    if (!showColors) {
      // Default blue text color when colors are hidden
      return 'text-blue-700';
    }
    
    return promptType === 'cross-topic' ? 'text-green-700' : 'text-blue-700';
  };

  return (
    <div className="w-full sm:w-[70vw] max-w-none mx-auto flex flex-col bg-white sm:rounded-2xl sm:shadow-lg sm:border sm:border-gray-200 h-[90vh] sm:h-[95vh]">
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row w-full items-start sm:items-center gap-3 p-4 pb-4 border-b border-gray-200">
        {/* Left side: Mode selection and display controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Mode Selection Group */}
          <div className="flex items-center gap-2 mr-6">
            <button
              className={`px-6 py-3 rounded-lg border font-semibold transition duration-200 text-base
                ${activeMode === 'horizontal'
                  ? 'bg-green-500 text-white border-green-600 shadow-md'
                  : 'bg-gray-100 text-green-700 border-green-300 hover:bg-green-50 hover:shadow-sm'}
              `}
              onClick={() => handleModeChange('horizontal')}
              disabled={isLoading}
            >
              Cross-Topic
            </button>
            <button
              className={`px-6 py-3 rounded-lg border font-semibold transition duration-200 text-base
                ${activeMode === 'vertical'
                  ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                  : 'bg-gray-100 text-blue-700 border-blue-300 hover:bg-blue-50 hover:shadow-sm'}
              `}
              onClick={() => handleModeChange('vertical')}
              disabled={isLoading}
            >
              In-Depth
            </button>
            <button
              className={`px-6 py-3 rounded-lg border font-semibold transition duration-200 text-base
                ${activeMode === 'mixed'
                  ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                  : 'bg-gray-100 text-purple-700 border-purple-300 hover:bg-purple-50 hover:shadow-sm'}
              `}
              onClick={() => handleModeChange('mixed')}
              disabled={isLoading}
            >
              Mixed
            </button>
          </div>
          
          {/* Display Controls Group */}
          <div className="flex items-center gap-1">
            <button
              className={`px-3 py-2 rounded-lg border transition duration-200 text-sm font-medium ${
                showFollowUpAsText
                  ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 hover:shadow-sm'
                  : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:shadow-sm'
              }`}
              onClick={() => setShowFollowUpAsText(!showFollowUpAsText)}
            >
              {showFollowUpAsText ? 'Show as Buttons' : 'Show as Text'}
            </button>
            <button
              className={`px-3 py-2 rounded-lg border transition duration-200 text-sm font-medium ${
                showColors
                  ? 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:shadow-sm'
                  : 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:shadow-sm'
              }`}
              onClick={() => setShowColors(!showColors)}
            >
              {showColors ? 'Hide Colors' : 'Differentiate Colors'}
            </button>
          </div>
        </div>
        
        {/* Right side: Utility buttons and prompt info */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
        <button
              className="px-3 py-2 rounded-lg bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition duration-200 text-sm font-medium"
          onClick={() => setShowClearConfirm(true)}
        >
          Clear History
        </button>
        <button
              className="px-3 py-2 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition duration-200 text-sm font-medium"
          onClick={() => { setTempPrompt(prompt); setShowPromptModal(true); }}
        >
          Edit Prompt
        </button>
          </div>
          <div className="flex-1 sm:flex-none">
            <span className="text-xs text-gray-500 truncate max-w-full sm:max-w-[250px] block" title={prompt}>
          Current Prompt: {prompt}
        </span>
          </div>
        </div>
      </div>
      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-4 text-black">Clear all chat history?</h2>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-red-600 text-white border border-red-700 hover:bg-red-700"
                onClick={() => {
                  setChatFlows({
                    horizontal: { messages: [], step: 1 },
                    vertical: { messages: [], step: 1 },
                    mixed: { messages: [], mixedStep: 1 },
                  });
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                  }
                  setShowClearConfirm(false);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Chat Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-line break-words shadow-sm ${
                msg.isUser
                  ? 'bg-blue-500 text-white rounded-br-md ml-auto'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}
              style={{ lineHeight: 1.4 }}
            >
              {/* 用户消息为纯文本，AI消息为 markdown+代码块+loading动画 */}
              {msg.isUser ? (
                <span>{msg.text}</span>
              ) : (
                <>
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? (
                          <div style={{ margin: '0.5em 0' }}>
                        <CodeBlock language={match?.[1] || ''} value={String(children).replace(/\n$/, '')} />
                          </div>
                      ) : (
                        <code className={className} {...props}>{children}</code>
                      );
                      },
                      p: createParagraph(msg.source === 'rule')
                  }}
                >
                    {typeof msg.text === 'string'
                      ? (msg.source === 'LLM'
                          ? processLLMText(msg.text)
                          : msg.text)
                      : ''}
                </ReactMarkdown>
                  {showLoading && idx === messages.length - 1 && (
                    <span className="inline-flex items-center ml-1 align-bottom">
                      <span className="animate-bounce text-2xl text-gray-400 select-none">.</span>
                      <span className="animate-bounce text-2xl text-gray-400 select-none" style={{ animationDelay: '0.2s' }}>.</span>
                      <span className="animate-bounce text-2xl text-gray-400 select-none" style={{ animationDelay: '0.4s' }}>.</span>
                    </span>
                  )}
                </>
              )}
              {/* 推荐内容渲染，假设 prompts 是一个字符串数组 */}
              {Array.isArray(msg.prompts) && msg.prompts.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 items-start">
                  <div className="text-sm text-gray-500 mb-1">You may also be interested in the following:</div>
                  {showFollowUpAsText ? (
                    // Text mode: display position and question separately
                    <div className="text-sm space-y-1">
                      {msg.prompts.map((prompt, i) => {
                        const positionMatch = prompt.match(/^([0-9.]+) (.+)$/);
                        const fullPosition = positionMatch ? positionMatch[1] : '';
                        const question = positionMatch ? positionMatch[2] : prompt;
                        
                        // Remove the last position number (e.g., "3.1.1.1" -> "3.1.1")
                        const displayPosition = fullPosition.split('.').slice(0, -1).join('.');
                        
                        // For mixed mode, determine colors based on the step used for this request
                        const isMixedMode = activeMode === 'mixed';
                        const requestStep = msg.requestStep || 1;
                        const isOddStep = requestStep % 2 === 1;
                        const crossCount = isOddStep ? 3 : 2;
                        const isCrossTopic = i < crossCount;
                        
                        return (
                          <div key={i} className="flex items-start">
                            <span className={`mr-2 min-w-[60px] font-mono text-xs ${showColors ? (activeMode === 'horizontal' ? 'text-green-600' : activeMode === 'vertical' ? 'text-blue-600' : (isCrossTopic ? 'text-green-600' : 'text-blue-600')) : 'text-blue-700'}`}>
                              {displayPosition}
                            </span>
                            <span className={`whitespace-pre-line ${showColors ? (activeMode === 'horizontal' ? 'text-green-700' : activeMode === 'vertical' ? 'text-blue-700' : (isCrossTopic ? 'text-green-700' : 'text-blue-700')) : 'text-blue-700'}`}>{question}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Button mode: display full text (position + question) as clickable buttons
                    msg.prompts.map((prompt, i) => {
                      const positionMatch = prompt.match(/^([0-9.]+) (.+)$/);
                      const fullPosition = positionMatch ? positionMatch[1] : '';
                      const question = positionMatch ? positionMatch[2] : prompt;
                      
                      // Remove the last position number for display
                      const displayPosition = fullPosition.split('.').slice(0, -1).join('.');
                      const displayText = positionMatch ? `${displayPosition} ${question}` : prompt;
                      
                      // For mixed mode, determine colors based on the step used for this request
                      const isMixedMode = activeMode === 'mixed';
                      const requestStep = msg.requestStep || 1;
                      const isOddStep = requestStep % 2 === 1;
                      const crossCount = isOddStep ? 3 : 2;
                      const isCrossTopic = i < crossCount;
                      
                      return (
                        <button
                          key={i}
                          className={`text-left px-3 py-2 rounded-lg border transition text-sm ${showColors ? (activeMode === 'horizontal' ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300' : activeMode === 'vertical' ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300' : (isCrossTopic ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300')) : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'}`}
                          onClick={() => handlePromptClick(prompt)}
                          disabled={isLoading}
                        >
                          <span className={`font-medium ${showColors ? (activeMode === 'horizontal' ? 'text-green-700' : activeMode === 'vertical' ? 'text-blue-700' : (isCrossTopic ? 'text-green-700' : 'text-blue-700')) : 'text-blue-700'}`}>
                            {displayText}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              {/* 显示来源标签 - 已移除，让用户无法区分规则和LLM响应 */}
              {/* {msg.source && (
                <span className="text-xs text-gray-400 ml-2">[{msg.source === 'rule' ? 'Rule' : 'LLM'}]</span>
              )} */}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex p-4 border-t border-gray-200 bg-gray-50">
        <textarea
          className="flex-1 mr-3 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={2}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading && input.trim()) {
                (e.target as HTMLTextAreaElement).form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }
          }}
        />
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
      {/* Prompt Edit Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Custom Prompt</h2>
            <textarea
              className="textarea textarea-bordered w-full mb-4"
              rows={8}
              value={tempPrompt}
              onChange={e => setTempPrompt(e.target.value)}
              placeholder="Enter your custom system prompt..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                onClick={() => setShowPromptModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                onClick={() => { setPrompt(tempPrompt); setShowPromptModal(false); }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
