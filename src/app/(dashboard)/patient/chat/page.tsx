'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, doc, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Send, Store, Loader2 } from 'lucide-react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

export default function PatientChatPage() {
  const { user } = useAuth();
  const langContext = useContext(LanguageContext);
  const language = langContext?.language || 'en';
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // First, clear patient unread counts
    const chatRef = doc(db, 'pharmacy_chats', user.id);
    updateDoc(chatRef, { unreadCountPatient: 0 }).catch(() => {
      // Ignore error if document doesn't exist yet
    });

    const messagesRef = collection(chatRef, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setIsLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Clear unread count when viewing
      if (snapshot.docs.length > 0) {
        updateDoc(chatRef, { unreadCountPatient: 0 }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const chatRef = doc(db, 'pharmacy_chats', user.id);
      
      // Ensure the chat document exists
      await setDoc(chatRef, {
        patientId: user.id,
        patientName: user.name,
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        unreadCountPatient: 0,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Atomically increment pharmacy unread count using standard update approach
      // (Using a simple write here since transactions are complex on client, 
      // but in production FieldValue.increment(1) is better)
      import('firebase/firestore').then(({ increment }) => {
         updateDoc(chatRef, { unreadCountPharmacy: increment(1) });
      });

      const messagesRef = collection(chatRef, 'messages');
      await addDoc(messagesRef, {
        text,
        senderId: user.id,
        senderRole: 'PATIENT',
        timestamp: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white p-5 rounded-t-3xl border border-slate-200 border-b-0 flex items-center gap-4 shadow-sm z-10">
        <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center border border-teal-100">
          <Store className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Hospital Pharmacy</h1>
          <p className="text-xs text-teal-600 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online • Usually replies instantly
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Store className="w-12 h-12 text-slate-300" />
            <p>Send a message to our pharmacy team.</p>
            <p className="text-xs text-slate-400">Ask about medicine availability or your order status.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === 'PATIENT';
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
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
      <div className="bg-white p-4 rounded-b-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 rounded-xl font-bold transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
