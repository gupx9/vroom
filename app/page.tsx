import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative red glowing background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-800 rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      
      <main className="z-10 flex flex-col items-center justify-center text-center px-4">
        <Image src="/logo.png" alt="VROOM.IO" width={720} height={250} className="mb-6 drop-shadow-sm" priority />
        
        <p className="max-w-[600px] text-zinc-400 text-lg md:text-xl mb-12 font-medium">
          The ultimate platform for managing your automotive needs. Experience performance, precision, and power.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-sm">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-[0_0_40px_-10px_rgba(220,38,38,0.7)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
          >
            Sign Up
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-white font-bold rounded-lg transition-all flex items-center justify-center"
          >
            Log In
          </Link>
        </div>
      </main>

      {/* Grid Pattern Background overlay (optional modern touch) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}
