'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addCar } from '@/app/actions/garage';

export default function AddCarForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageData || !description.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('imageData', imageData);
    formData.append('description', description);
    await addCar(formData);
    setLoading(false);
    onClose();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-zinc-700 rounded-xl overflow-hidden cursor-pointer hover:border-red-600/50 transition-colors bg-zinc-950"
        style={{ aspectRatio: '16/9' }}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="mt-2 text-sm font-medium">Click to upload image</p>
            <p className="text-xs text-zinc-600 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your car — make, model, year, mods, condition..."
        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-zinc-500 transition-colors"
        rows={3}
        required
      />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!imageData || !description.trim() || loading}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
        >
          {loading ? 'Adding...' : 'Add to Garage'}
        </button>
      </div>
    </form>
  );
}
