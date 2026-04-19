import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/app/actions/profile';
import UserProfileShowcase from '@/app/components/UserProfileShowcase';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const result = await getPublicProfile(username);

  if ('error' in result && result.error === 'User not found') notFound();
  if ('error' in result) return null;

  const { user, currentUserId, existingReview, existingReport } = result;

  return (
    <UserProfileShowcase
      profile={user}
      currentUserId={currentUserId}
      existingReview={existingReview ?? null}
      existingReport={existingReport ?? null}
    />
  );
}
