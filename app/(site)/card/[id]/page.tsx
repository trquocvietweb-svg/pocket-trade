'use client';

import { useRouter, useParams } from 'next/navigation';
import CardDetail from '../../../components/CardDetail';
import { Id } from '../../../../convex/_generated/dataModel';

export default function CardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as Id<"cards">;
  
  return (
    <CardDetail 
      cardId={cardId}
      onBack={() => router.back()}
    />
  );
}
