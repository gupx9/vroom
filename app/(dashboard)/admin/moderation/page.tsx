import { getModerationQueue } from '@/app/actions/admin';
import ModerationPanel from '@/app/components/ModerationPanel';
import { redirect } from 'next/navigation';

export default async function ModerationPage() {
  const result = await getModerationQueue().catch(() => null);

  if (!result || 'error' in result) redirect('/dashboard');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Moderation</h1>
        <p className="text-zinc-400 mt-1 text-sm">Review pending reports and low-star reviews</p>
      </div>
      <div className="pt-4">
        <ModerationPanel reports={result.reports} reviews={result.reviews} />
      </div>
    </div>
  );
}
