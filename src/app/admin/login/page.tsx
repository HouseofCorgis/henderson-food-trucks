'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/admin');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;
      setMessage('Check your email for a password reset link!');
    } catch (err) {
      setError('Error sending reset email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🚚</span>
          <h1 className="font-display text-2xl font-bold text-ridge-700 mt-4">What&apos;s Rollin&apos; Local</h1>
          <p className="text-stone-500 mt-2">
            {mode === 'login' ? 'Sign in to manage your truck' : 'Reset your password'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ridge-600 hover:bg-ridge-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                className="text-ridge-600 hover:text-ridge-700 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-ridge-500 focus:border-ridge-500"
                placeholder="you@example.com"
              />
              <p className="text-stone-500 text-sm mt-2">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ridge-600 hover:bg-ridge-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="text-ridge-600 hover:text-ridge-700 text-sm"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-ridge-600 hover:text-ridge-700 text-sm">
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
