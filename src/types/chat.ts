export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: string;
  recipientId: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  updatedAt: Date;
}
