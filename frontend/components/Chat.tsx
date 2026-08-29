import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { Send, Bot, User } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const Chat: React.FC<ChatProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await sendChatMessage(userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error processing your request. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-120px)] overflow-hidden shadow-2xl">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-full">
            <Bot className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">FinWise Advisor</h2>
            <p className="text-xs text-gray-400">Ask questions or adjust your strategy</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <Bot className="w-12 h-12 opacity-20" />
              <p>No messages yet. Ask me about your generated plan!</p>
              <div className="flex gap-2 flex-wrap justify-center mt-4">
                <button onClick={() => setInput("What if I take a 6-month sabbatical in year 3?")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors">What if I take a sabbatical?</button>
                <button onClick={() => setInput("How does inflation affect this projection?")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors">How does inflation affect this?</button>
                <button onClick={() => setInput("Can we make the portfolio more aggressive?")} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors">Make it more aggressive</button>
              </div>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-none px-5 py-4 border border-gray-700 flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message FinWise..."
              className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none overflow-hidden min-h-[50px] max-h-[150px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 text-emerald-500 hover:text-emerald-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            FinWise AI can make mistakes. Consider verifying important financial information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;