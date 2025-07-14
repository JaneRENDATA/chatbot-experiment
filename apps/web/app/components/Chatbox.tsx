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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
      
      console.log('Chat response status:', response.status);
      console.log('Chat response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat error response:', errorText);
        throw new Error(`Network response was not ok: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Chat response data:', data);
      
      const aiMessage: IMessage = { id: Date.now() + 1, text: data.choices?.[0]?.message?.content || 'No response', isUser: false };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now() + 2, text: `Error: ${error.message}`, isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] w-[70vw] max-w-none mx-auto bg-white rounded-2xl shadow border border-gray-200 p-6 relative">
      {/* Prompt settings and current prompt display */}
      <div className="flex items-center mb-4">
        <button
          className="px-4 py-1 rounded bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition"
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
