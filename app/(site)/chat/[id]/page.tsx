'use client';

import { useRouter, useParams } from 'next/navigation';
import ChatDetail from '../../../components/ChatDetail';

export default function ChatDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  return (
    <ChatDetail
      chatId={chatId}
      onBack={() => router.back()}
    />
  );
}
