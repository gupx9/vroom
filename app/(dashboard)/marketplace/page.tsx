import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMarketplaceListings } from '@/app/actions/marketplace';
import MarketplaceGrid from '@/app/components/MarketplaceGrid';

export default async function MarketplacePage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const { cars, dioramas } = await getMarketplaceListings();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Marketplace</h1>
        <p className="text-zinc-400 mt-1 text-sm">Browse buy &amp; sell listings</p>
      </div>
      <div className="pt-4">
        <MarketplaceGrid cars={cars} dioramas={dioramas} />
      </div>
    </div>
  );
}
