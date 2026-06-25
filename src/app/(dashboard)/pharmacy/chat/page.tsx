'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { db } from '@/lib/firebase/client';
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Send, Store, User, Search, Loader2 } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useAuth } from '@/context/AuthContext';

export default function PharmacyChatPage() {
  const { user } = useAuth();
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Listen for all patient chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'pharmacy_chats');
    const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(fetchedChats);
      setIsLoadingChats(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Listen for messages of selected chat
  useEffect(() => {
    if (!selectedChat) return;

    setIsLoadingMessages(true);
    const chatRef = doc(db, 'pharmacy_chats', selectedChat.id);
    
    // Clear unread count for pharmacy
    updateDoc(chatRef, { unreadCountPharmacy: 0 }).catch(() => {});

    const messagesRef = collection(chatRef, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setIsLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      if (snapshot.docs.length > 0) {
        updateDoc(chatRef, { unreadCountPharmacy: 0 }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const chatRef = doc(db, 'pharmacy_chats', selectedChat.id);
      
      // Increment patient unread count
      import('firebase/firestore').then(({ increment }) => {
        updateDoc(chatRef, { 
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          unreadCountPatient: increment(1),
          updatedAt: serverTimestamp()
        });
      });

      const messagesRef = collection(chatRef, 'messages');
      await addDoc(messagesRef, {
        text,
        senderId: user.id,
        senderRole: 'PHARMACIST',
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    
    // If today, show time. Otherwise show date.
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(chat => 
    chat.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm flex overflow-hidden font-sans">
      
      {/* ── Left Pane: Chat List ── */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" /> Patient Queries
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients or messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoadingChats ? (
            <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No chats found.</div>
          ) : (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 flex items-start gap-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                  {chat.patientName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{chat.patientName}</h3>
                    <span className="text-[10px] text-slate-400 shrink-0">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                </div>
                {chat.unreadCountPharmacy > 0 && (
                  <div className="bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-1">
                    {chat.unreadCountPharmacy}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Pane: Active Thread ── */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {selectedChat.patientName?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{selectedChat.patientName}</h3>
                <p className="text-xs text-slate-400">Patient • {selectedChat.id}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderRole === 'PHARMACIST';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe 
                            ? 'bg-teal-600 text-white rounded-br-sm shadow-sm' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 mx-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <User className="w-16 h-16 text-slate-300 mb-4" />
            <p className="font-medium text-slate-500">Select a patient conversation to start messaging</p>
          </div>
        )}
      </div>

    </div>
  );
}
