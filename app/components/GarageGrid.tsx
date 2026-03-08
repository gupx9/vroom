'use client';

import { useState } from 'react';
import GarageCard from './GarageCard';
import AddCarForm from './AddCarForm';

interface Car {
  id: string;
  imageData: string;
  description: string;
  forSale: boolean;
  forTrade: boolean;
}

export default function GarageGrid({ cars }: { cars: Car[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      {/* Add Car button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Car
        </button>
      </div>

      {/* Inline "Add Car" form panel */}
      {showForm && (
        <div className="mb-8 bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 max-w-lg">
          <h2 className="text-base font-bold mb-4 text-white">Add to Garage</h2>
          <AddCarForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Empty state */}
      {cars.length === 0 && !showForm && (
        <div className="text-center py-24 text-zinc-600">
          <svg className="mx-auto mb-4 opacity-40" xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-5H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <p className="text-lg font-medium text-zinc-500">Your garage is empty</p>
          <p className="text-sm mt-1 text-zinc-600">Click &ldquo;Add Car&rdquo; to showcase your first ride</p>
        </div>
      )}

      {/* Cars grid */}
      {cars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cars.map((car) => (
            <GarageCard key={car.id} {...car} />
          ))}
        </div>
      )}
    </div>
  );
}
