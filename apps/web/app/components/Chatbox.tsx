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

const DEFAULT_PROMPT = 'You are a Python tutor focused on teaching through connected concepts. When learners ask questions, show how different Python elements work together to solve problems. Start with the big picture, then demonstrate how basic concepts combine to create solutions. Use real-world examples to show concept relationships. Guide learners to discover patterns across different Python features. Encourage experimentation and help learners see multiple ways to solve problems. Always connect new learning to practical applications.';

interface IMessage {
  id: number;
  text: string;
  isUser: boolean;
  prompts?: string[]; // 新增 prompts 字段
  source?: string; // 新增 source 字段
}

const LOCAL_STORAGE_KEY = 'chatbox_messages_v1';
const PROMPT_STORAGE_KEY = 'chatbox_prompt_v1';

interface ChatboxProps {
  libId?: string | null;
  fileName?: string | null;
  scrapedUrl?: string | null;
  role?: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ libId, fileName, scrapedUrl, role }) => {
  const [messages, setMessages] = useState<IMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
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
  const [recommendMode, setRecommendMode] = useState<'horizontal' | 'vertical'>('horizontal');

  // 聊天记录持久化
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.warn('localStorage error:', error);
    }
  }, [messages]);

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
  }, [messages]);

  // 计算当前步数（用户消息数量）
  const getStep = () => messages.filter(m => m.isUser).length + 1;

  // 点击推荐 prompt
  const handlePromptClick = (promptText: string) => {
    setInput(promptText);
    setTimeout(() => {
      // 自动提交
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: IMessage = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowLoading(true);

    // 构造请求体
    const step = getStep();
    const payload = {
      messages: [
        { role: 'system', content: prompt },
        ...messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: input }
      ],
      step,
      recommendMode // 新增推荐方式参数
    };

    // 先插入一个空的 AI 消息
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, text: '', isUser: false }]);

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
        const now = Date.now();
        console.log('[前端] 收到 chunk:', now, decoder.decode(value));
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '');
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta;
              if (delta?.content) {
                aiText += delta.content; // 逐步追加，保证流式体验
                setMessages(prev => prev.map(msg =>
                  msg.id === aiMsgId ? { ...msg, text: aiText } : msg
                ));
                if (firstChunk) {
                  setShowLoading(false);
                  firstChunk = false;
                }
              }
              if (json.choices?.[0]?.finish_reason === 'stop') {
                prompts = json.choices?.[0]?.prompts || [];
                source = json.choices?.[0]?.source;
                setMessages(prev => prev.map(msg =>
                  msg.id === aiMsgId ? { ...msg, prompts, source } : msg
                ));
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => prev.map(msg =>
        msg.id === aiMsgId ? { ...msg, text: `Error: ${error.message}` } : msg
      ));
      setShowLoading(false);
    } finally {
      setIsLoading(false);
      setShowLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-[70vw] max-w-none mx-auto bg-white rounded-2xl shadow border border-gray-200 p-6 relative">
      {/* 推荐方式切换按钮 */}
      <div className="flex items-center mb-4 gap-2">
        <button
          className={`px-3 py-1 rounded border transition ${recommendMode === 'horizontal' ? 'bg-green-200 text-green-900 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
          onClick={() => setRecommendMode('horizontal')}
          disabled={isLoading}
        >
          Horizontal (Cross-topic)
        </button>
        <button
          className={`px-3 py-1 rounded border transition ${recommendMode === 'vertical' ? 'bg-purple-200 text-purple-900 border-purple-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
          onClick={() => setRecommendMode('vertical')}
          disabled={isLoading}
        >
          Vertical (In-depth)
        </button>
        {/* Prompt settings and current prompt display */}
        <button
          className="ml-2 px-4 py-1 rounded bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition"
          onClick={() => setShowClearConfirm(true)}
        >
          Clear History
        </button>
        <button
          className="ml-2 px-4 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition"
          onClick={() => { setTempPrompt(prompt); setShowPromptModal(true); }}
        >
          Edit Prompt
        </button>
        <span className="ml-4 text-xs text-gray-400 truncate max-w-[60%]" title={prompt}>
          Current Prompt: {prompt}
        </span>
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
                  setMessages([]);
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
      {/* 聊天内容 */}
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-xl whitespace-pre-line break-words shadow-sm ${
                msg.isUser
                  ? 'bg-blue-100 text-blue-900 rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
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
                          <CodeBlock language={match?.[1] || ''} value={String(children).replace(/\n$/, '')} />
                        ) : (
                          <code className={className} {...props}>{children}</code>
                        );
                      }
                    }}
                  >
                    {typeof msg.text === 'string' ? msg.text : ''}
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
              {/* 推荐 prompt 按钮等... */}
              {msg.prompts && msg.prompts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      className="px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition text-sm"
                      onClick={() => handlePromptClick(p)}
                      disabled={isLoading}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
              {/* 显示来源标签 */}
              {msg.source && (
                <span className="text-xs text-gray-400 ml-2">[{msg.source === 'rule' ? 'Rule' : 'LLM'}]</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex mt-2">
        <textarea
          className="poe-input flex-1 mr-2"
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
          className="poe-btn"
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
