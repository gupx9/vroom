'use client';

import { verifyOtp } from '@/app/actions/auth';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function clientAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await verifyOtp(formData);
    
    if (result?.error) {
      setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter text-white">Verify Account</h1>
        <p className="text-zinc-400 text-sm">
          Enter the OTP sent to <span className="text-white font-medium">{email}</span>
        </p>
        {/* For demo purposes */}
        <p className="text-xs text-red-500/80 italic mt-1">Hint: The default OTP is 123456</p>
      </div>

      <form action={clientAction} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950 border border-red-900 text-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}

        <input type="hidden" name="email" value={email} />

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="otp">One-Time Password</label>
          <input 
            type="text" 
            id="otp" 
            name="otp" 
            required 
            maxLength={6}
            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-zinc-600 text-center tracking-[0.5em] font-mono text-xl"
            placeholder="••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending || !email}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
