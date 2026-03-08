import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import GarageGrid from '@/app/components/GarageGrid';

export default async function GaragePage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const cars = await prisma.car.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      imageData: true,
      description: true,
      forSale: true,
      forTrade: true,
    },
  });

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Garage</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Showcase your collection &mdash; {cars.length} {cars.length === 1 ? 'car' : 'cars'}
        </p>
      </div>
      <div className="pt-4">
        <GarageGrid cars={cars} />
      </div>
    </div>
  );
}
