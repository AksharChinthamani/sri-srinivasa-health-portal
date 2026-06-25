'use client';
import { useContext } from 'react';

import React, { useState, useEffect, useRef } from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  richCard?: {
    type: 'appointment' | 'medicine';
    title: string;
    details: string[];
    action: string;
  };
};

export default function AIChatbot() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Hello! I am your AI Health Assistant powered by Gemini. How can I help you today?',
    }
  ]);
  
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping, expandedCardId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      setIsTyping(false);
      
      const aiMsg: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: data.reply,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setIsTyping(false);
      const aiMsg: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an issue connecting to the AI assistant. Please try again.',
      };
      setMessages(prev => [...prev, aiMsg]);
    }
  };

  return (
    <>
      {/* Floating Orb */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-white shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform group"
        >
          {/* Gentle pulse when idle */}
          <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20"></div>
          <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          
          <div className="absolute bottom-full mb-3 right-0 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {getTranslation(language, 'auto.chat_with_ai_assistant')}</div>
        </button>
      )}

      {/* Dedicated Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-[90vw] md:w-[400px] h-[80vh] md:h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                ✨
              </div>
              <div>
                <h3 className="font-bold text-sm">{getTranslation(language, 'auto.health_assistant')}</h3>
                <div className="text-[10px] text-teal-200 flex items-center gap-1">
                  {getTranslation(language, 'auto.powered_by_gemini')}<svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    isUser 
                      ? 'bg-slate-900 text-white rounded-br-none shadow-sm' 
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Rich Card Rendering */}
                  {msg.richCard && (
                    <div className="mt-2 max-w-[85%] w-full">
                      <div 
                        className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer ${
                          expandedCardId === msg.id ? 'border-teal-500 shadow-md ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-300'
                        }`}
                        onClick={() => setExpandedCardId(expandedCardId === msg.id ? null : msg.id)}
                      >
                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            {msg.richCard.type === 'appointment' ? '🗓️ Appointment' : '💊 Medicine'}
                          </span>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedCardId === msg.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-slate-900 mb-1">{msg.richCard.title}</h4>
                          
                          {expandedCardId === msg.id && (
                            <div className="mt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                              {msg.richCard.details.map((detail, idx) => (
                                <p key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                  {detail}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          <button className="mt-4 w-full py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs rounded-lg transition-colors border border-teal-200">
                            {msg.richCard.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes pulse-dot {
                      0%, 100% { opacity: 0.4; transform: scale(0.8); }
                      50% { opacity: 1; transform: scale(1.2); }
                    }
                    .ai-dot { width: 6px; height: 6px; background-color: #0d9488; border-radius: 50%; animation: pulse-dot 1.4s infinite ease-in-out both; }
                    .ai-dot:nth-child(1) { animation-delay: -0.32s; }
                    .ai-dot:nth-child(2) { animation-delay: -0.16s; }
                  `}} />
                  <div className="ai-dot"></div>
                  <div className="ai-dot"></div>
                  <div className="ai-dot"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <input 
                type="text" 
                placeholder={getTranslation(language, 'auto.ask_gemini')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-100 border border-transparent focus:bg-white focus:border-teal-300 focus:ring-2 focus:ring-teal-100 rounded-full pl-4 pr-12 py-3 text-sm outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim()}
                className="absolute right-2 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{getTranslation(language, 'auto.ai_can_make_mistakes_check_important_inf')}</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
