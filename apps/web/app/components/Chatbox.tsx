import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { chatWithAI } from '../services/chatService';
import Markdown from './Markdown';
import vegaEmbed from 'vega-embed';

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
                const lines = text.split('\n\n').filter(line => line.trim() !== '');
                
                if (lines.length === 0) {
                    // 如果没有有效的行，直接添加整个文本
                    aiResponse += text;
                    const aiMsg = { id: Date.now(), text: aiResponse, isUser: false }
                    setMessages(prev => [...prev.slice(0, -1), aiMsg]);
                } else {
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            aiResponse += line.slice(6);
                        } else {
                            aiResponse += line;
                        }
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

    const renderVegaLite = useCallback((container: HTMLDivElement, spec: any) => {
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        if (containerWidth === 0) {
            setTimeout(() => renderVegaLite(container, spec), 100);
            return;
        }

        const adjustedSpec = {
            ...spec,
            width: 'container',
            height: 'container',
            autosize: {
                type: 'fit',
                contains: 'padding'
            }
        };

        const chartWidth = containerWidth;
        const chartHeight = Math.min(300, containerWidth * 0.5); // 将高度设置为宽度的一半，但不超过300px

        vegaEmbed(container, adjustedSpec, { 
            actions: false,
            renderer: 'svg',
            width: chartWidth,
            height: chartHeight
        }).catch(console.error);
    }, []);

    const MessageContent: React.FC<{ message: IMessage }> = ({ message }) => {
        const vegaContainerRef = useRef<HTMLDivElement>(null);
        const [vegaSpec, setVegaSpec] = useState<any>(null);
        const [cleanedText, setCleanedText] = useState(message.text);

        useEffect(() => {
            const chartDataRegex = /CHART_DATA:\{.*?\}END_CHART_DATA/s;
            const vegaLiteRegex = /VEGALITE_BEGIN:(.*?)VEGALITE_END/s;

            let newCleanedText = message.text.replace(chartDataRegex, '');
            newCleanedText = newCleanedText.replace(vegaLiteRegex, '');
            setCleanedText(newCleanedText.trim());

            const vegaMatch = message.text.match(vegaLiteRegex);
            if (vegaMatch) {
                try {
                    const spec = JSON.parse(vegaMatch[1]);
                    // 移除原始规范中的width和height
                    const { width, height, ...restSpec } = spec;
                    setVegaSpec(restSpec);
                } catch (error) {
                    console.error('Failed to parse Vega-Lite spec:', error);
                }
            }
        }, [message.text]);

        useEffect(() => {
            if (vegaContainerRef.current && vegaSpec) {
                const resizeObserver = new ResizeObserver(() => {
                    renderVegaLite(vegaContainerRef.current!, vegaSpec);
                });
                resizeObserver.observe(vegaContainerRef.current);
                renderVegaLite(vegaContainerRef.current, vegaSpec);
                return () => resizeObserver.disconnect();
            }
        }, [vegaSpec, renderVegaLite]);

        return (
            <>
                {message.isUser || message.isSystem ? (
                    cleanedText
                ) : (
                    <>
                        <Markdown value={cleanedText} />
                        {vegaSpec && (
                            <div 
                                ref={vegaContainerRef} 
                                className="mt-4 w-full" 
                                style={{
                                    maxWidth: '90%',
                                    overflow: 'hidden',
                                    minHeight: '350px', // 减小最小高度
                                    maxHeight: '600px'  // 减小最大高度
                                }}
                            />
                        )}
                    </>
                )}
            </>
        );
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
                            <MessageContent message={message} />
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