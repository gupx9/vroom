import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import CommunityChatClient from '@/app/components/CommunityChatClient';

export default async function CommunityPage() {
  const session = await verifySession();

  if (!session?.userId) {
    redirect('/login');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Community Chat</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Global discussion board for all collectors.
        </p>
      </div>
      <CommunityChatClient />
    </div>
  );
}
