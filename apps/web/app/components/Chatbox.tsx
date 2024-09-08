import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { chatWithAI } from '../services/chatService';
import Markdown from './Markdown';

interface IMessage {
    id: number;
    text: string;
    isUser: boolean;
    isSystem?: boolean;
}

interface IChatboxProps {
    libId: string;
}

// Add this type definition for the code component props

// Add this interface for ChatMessage
interface ChatMessage {
    role: string;
    content: string;
}

const Chatbox: React.FC<IChatboxProps> = ({ libId }) => {
    const initialMessage: IMessage = {
        id: 0,
        text: `Your library ID is: ${libId}. Please input anything you want to ask about your data.`,
        isUser: false,
        isSystem: true
    };

    const [messages, setMessages] = useState<IMessage[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim()) return;

        const userMessage: IMessage = { id: Date.now(), text: input, isUser: true };

        const aiMsg = { id: Date.now(), text: 'AI is thinking...', isUser: false }
        setMessages(prev => [...prev, userMessage, aiMsg]);
        setInput('');
        setIsLoading(true);

        let aiResponse = '';
        try {
            // Format messages for the API
            const chatMessages: ChatMessage[] = messages
                .filter(msg => !msg.isSystem)
                .map(msg => ({
                    role: msg.isUser ? 'user' : 'assistant',
                    content: msg.text
                }));
            chatMessages.push({ role: 'user', content: input });

            const stream = await chatWithAI(libId, chatMessages);
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = new TextDecoder().decode(value);
                const lines = text.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        aiResponse += line.slice(6);

                        const aiMsg = { id: Date.now(), text: aiResponse, isUser: false }
                        setMessages(prev => [...prev.slice(0, -1), aiMsg]);
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

    const handleClearChat = () => {
        setMessages([initialMessage]);
    };

    return (
        <div className="flex flex-col h-[600px] w-full mx-auto bg-base-300 rounded-lg shadow-lg relative">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${message.isSystem
                            ? 'bg-gray-200 text-gray-600'
                            : message.isUser
                                ? 'bg-blue-500 text-white'
                                : 'bg-primary text-primary-content'
                            }`}>
                            {message.isUser || message.isSystem ? (
                                message.text
                            ) : (
                                <Markdown value={message.text} />
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {messages.length > 1 && (
                <>
                    <div className="divider m-0"></div>
                    <div className="flex justify-center mb-1 px-1">
                        <button
                            onClick={handleClearChat}
                            className="btn btn-ghost btn-sm text-warning hover:bg-warning hover:bg-opacity-20 px-1"
                            title="Clear chat"
                        >
                            <TrashIcon className="h-5 w-5 mr-1 text-warning" />
                            <span className="text-warning">Clear Chat</span>
                        </button>
                    </div>
                </>
            )}
            <form onSubmit={handleSubmit} className="bg-base-300 rounded-b-lg">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
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