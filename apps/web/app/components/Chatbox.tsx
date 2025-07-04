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

const DEFAULT_PROMPT = 'You are a helpful assistant.';

interface IMessage {
  id: number;
  text: string;
  isUser: boolean;
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: IMessage = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${CHAT_BASE_URL}${CHAT_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [
          { role: 'system', content: prompt },
          ...messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
          { role: 'user', content: input }
        ] }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const aiMessage: IMessage = { id: Date.now() + 1, text: data.choices?.[0]?.message?.content || 'No response', isUser: false };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 2, text: 'An error occurred. Please try again.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-[70vw] max-w-none mx-auto bg-white rounded-2xl shadow border border-gray-200 p-6 relative">
      {/* 设置按钮和当前 prompt 展示 */}
      <div className="flex items-center mb-4">
        <button
          className="ml-auto px-4 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition"
          onClick={() => { setTempPrompt(prompt); setShowPromptModal(true); }}
        >
          设置
        </button>
        <span className="ml-4 text-xs text-gray-400 truncate max-w-[60%]" title={prompt}>
          当前Prompt: {prompt}
        </span>
      </div>
      {/* 聊天内容 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={message.isUser ? 'poe-bubble-user px-4 py-2 text-base max-w-[75%]' : 'poe-bubble-ai px-4 py-2 text-base max-w-[75%]'}>
              {message.isUser ? (
                <span style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.8}}>{message.text}</span>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p style={{margin: '0 0 1em 0', lineHeight: '1.8'}} {...props} />,
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
                  {message.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="flex mt-2">
        <textarea
          className="poe-input flex-1 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={2}
        />
        <button
          className="poe-btn"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
      {/* Prompt 设置 Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">自定义 Prompt</h2>
            <textarea
              className="w-full border rounded p-2 mb-4 min-h-[60px]"
              value={tempPrompt}
              onChange={e => setTempPrompt(e.target.value)}
              placeholder="输入自定义系统提示词..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                onClick={() => setShowPromptModal(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
                onClick={() => { setPrompt(tempPrompt); setShowPromptModal(false); }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
