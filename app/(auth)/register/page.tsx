'use client';

import { register } from '@/app/actions/auth';
import Link from 'next/link';
import { useState, useActionState } from 'react';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function clientAction(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await register(formData);
    
    if (result?.error) {
      setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter text-white">Join <span className="text-red-600">VROOM.IO</span></h1>
        <p className="text-zinc-400 text-sm">Create an account to get started</p>
      </div>

      <form action={clientAction} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950 border border-red-900 text-red-200 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            required 
            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-zinc-600"
            placeholder="johndoe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-zinc-600"
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300" htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-zinc-600"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{' '}
        <Link href="/login" className="text-red-500 hover:text-red-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
