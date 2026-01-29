'use client';

import { useRouter } from 'next/navigation';
import ChatPage from '../../components/ChatPage';

export default function ChatListPage() {
  const router = useRouter();
  
  return (
    <ChatPage 
      onChatClick={(chat) => router.push(`/chat/${chat.id}`)} 
    />
  );
}
