'use client';
import { useContext } from 'react';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export default function ChatPage() {
    const langContext = useContext(LanguageContext);
      const language = langContext?.language || 'en';
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/users');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        setActiveId(currentId => {
          if (!currentId && data.length > 0) return data[0].id;
          return currentId;
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?userId=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (senderId: string) => {
    try {
      await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      });
      // Refresh unread counts in conversations
      fetchConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Poll for conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for messages when a conversation is active
  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      markAsRead(activeId); // Mark as read when opened

      const interval = setInterval(() => {
        fetchMessages(activeId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeId || !user) return;

    const tempMessage = {
      id: Date.now().toString(),
      content: inputValue,
      senderId: user?.id ?? '',
      receiverId: activeId,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, tempMessage]);
    setInputValue('');

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeId, content: tempMessage.content }),
      });
      // Re-fetch to get actual DB message
      fetchMessages(activeId);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const activeChat = conversations.find(c => c.id === activeId);
  const filteredList = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const isPatient = user?.role === 'PATIENT';

  return (
    <div className="max-w-7xl mx-auto h-[80vh] flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      
      {/* Left Panel: Conversation List (Hidden for Patients) */}
      {!isPatient && (
        <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{getTranslation(language, 'auto.messages')}</h2>
            <div className="relative">
            <input 
              type="text" 
              placeholder={getTranslation(language, 'auto.search_conversations')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredList.map(conv => (
            <div 
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id);
                setMessages([]); // Clear while loading
              }}
              className={`p-4 border-b border-slate-100 flex items-start gap-3 cursor-pointer transition-colors ${
                activeId === conv.id ? 'bg-teal-50' : 'hover:bg-slate-100/50'
              }`}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl border border-slate-200 shadow-sm flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{conv.name}</h3>
                  <span className={`text-[10px] whitespace-nowrap ${conv.unread > 0 ? 'text-teal-600 font-bold' : 'text-slate-400'}`}>
                    {conv.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate mr-2 ${conv.unread > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                  {conv.unread > 0 && (
                    <span className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredList.length === 0 && (
            <div className="p-4 text-center text-sm text-slate-500">{getTranslation(language, 'auto.no_conversations_found')}</div>
          )}
        </div>
      </div>
      )}

      {/* Right Panel: Messenger Layout */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl border border-slate-200">
                  {activeChat.avatar}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{activeChat.name}</h2>
                  <p className="text-xs text-slate-500">{activeChat.role}</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 text-sm mt-10">{getTranslation(language, 'auto.no_messages_yet_send_a_message_to_start')}</div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-teal-600 text-white rounded-br-none shadow-sm' 
                        : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>{timeStr}</span>
                      {isMe && (
                        <svg className={`w-3 h-3 ${msg.isRead ? 'text-blue-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 18l4 4L19 12" className="opacity-50" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder={getTranslation(language, 'auto.type_your_message')}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-100 border border-transparent focus:border-teal-300 focus:bg-white rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!inputValue.trim()}
                  className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>{getTranslation(language, 'auto.select_a_conversation_to_start_chatting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
