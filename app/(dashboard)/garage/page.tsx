import { verifySession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import GarageGrid from '@/app/components/GarageGrid';

type GarageCar = {
  id: string;
  imageData: string;
  brand: string;
  carModel: string;
  size: string;
  condition: string;
  price: number;
  sellingPrice: number;
  forSale: boolean;
  forTrade: boolean;
};

type GarageDiorama = {
  id: string;
  imageData: string | null;
  description: string;
  price: number;
  sellingPrice: number;
  forSale: boolean;
  forTrade: boolean;
};

export default async function GaragePage() {
  const session = await verifySession();
  if (!session?.userId) redirect('/login');

  const [cars, dioramas]: [GarageCar[], GarageDiorama[]] = await Promise.all([
    prisma.car.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        brand: true,
        carModel: true,
        size: true,
        condition: true,
        price: true,
        sellingPrice: true,
        forSale: true,
        forTrade: true,
      },
    }),
    prisma.diorama.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        imageData: true,
        description: true,
        price: true,
        sellingPrice: true,
        forSale: true,
        forTrade: true,
      },
    }),
  ]);

  const totalWorth =
    cars.reduce((sum: number, c: GarageCar) => sum + c.price, 0) +
    dioramas.reduce((sum: number, d: GarageDiorama) => sum + d.price, 0);

  const totalItems = cars.length + dioramas.length;

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Garage</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Showcase your collection &mdash; {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="pt-4">
        <GarageGrid cars={cars} dioramas={dioramas} totalWorth={totalWorth} />
      </div>
    </div>
  );
}

