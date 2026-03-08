'use client';

import { useEffect, useRef, useState } from 'react';
import GarageCard from './GarageCard';
import DioramaCard from './DioramaCard';
import AddCarModal from './AddCarModal';
import AddDioramaModal from './AddDioramaModal';

interface CarItem {
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
}

interface DioramaItem {
  id: string;
  imageData: string | null;
  description: string;
  price: number;
  sellingPrice: number;
  forSale: boolean;
  forTrade: boolean;
}

interface GarageGridProps {
  cars: CarItem[];
  dioramas: DioramaItem[];
  totalWorth: number;
}

export default function GarageGrid({ cars, dioramas, totalWorth }: GarageGridProps) {
  const [showCarModal, setShowCarModal] = useState(false);
  const [showDioramaModal, setShowDioramaModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalItems = cars.length + dioramas.length;

  return (
    <div>
      {/* Top bar — Update Garage button + Total Worth */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Update Garage dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Update Garage
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-20">
              <button
                onClick={() => { setShowCarModal(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-5H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
                </svg>
                Add Car
              </button>
              <div className="h-px bg-zinc-800" />
              <button
                onClick={() => { setShowDioramaModal(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Add Diorama
              </button>
            </div>
          )}
        </div>

        {/* Total worth */}
        {totalItems > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-zinc-500">Total inventory worth</span>
            <span className="ml-2 text-white font-bold">৳{totalWorth.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="text-center py-24 text-zinc-600">
          <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-5H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <p className="text-lg font-medium text-zinc-500">Your garage is empty</p>
          <p className="text-sm mt-1 text-zinc-600">Click &ldquo;Update Garage&rdquo; to add your first item</p>
        </div>
      )}

      {/* Cars section */}
      {cars.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Cars <span className="text-zinc-700">({cars.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {cars.map((car) => (
              <GarageCard key={car.id} {...car} />
            ))}
          </div>
        </div>
      )}

      {/* Dioramas section */}
      {dioramas.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
            Dioramas <span className="text-zinc-700">({dioramas.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {dioramas.map((d) => (
              <DioramaCard key={d.id} {...d} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCarModal && <AddCarModal onClose={() => setShowCarModal(false)} />}
      {showDioramaModal && <AddDioramaModal onClose={() => setShowDioramaModal(false)} />}
    </div>
  );
}

