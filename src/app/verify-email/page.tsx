'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }
    api.get(`/auth/verify-email/${token}`)
      .then((res) => { setStatus('success'); setMessage(res.data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.'); });
  }, [token]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
        </div>
      )}
      {status === 'success' && (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="w-14 h-14 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">{message}</p>
          <Link href="/login" className="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Go to Login
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <XCircle className="w-14 h-14 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">{message}</p>
          <Link href="/login" className="mt-4 inline-block text-indigo-600 font-medium hover:underline text-sm">
            Back to login to request a new link
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-6">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-gray-400">Loading...</p>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
