import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/chatService';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

interface ChatboxProps {
  libId: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ libId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await chatWithAI(libId, input);
      const reader = stream.getReader();
      let aiResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            aiResponse += line.slice(6);
            setMessages(prev => [
              ...prev.slice(0, -1),
              { id: Date.now(), text: aiResponse, isUser: false }
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { id: Date.now(), text: 'An error occurred. Please try again.', isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-base-300 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${message.isUser ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'}`}>
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-base-200 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 input input-bordered"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner"></span> : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbox;