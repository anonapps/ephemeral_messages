'use client';

import { useEffect, useState } from 'react';

import { readNote } from '@/lib/api';
import { decryptMessage } from '@/lib/crypto';
import { REVEAL_SECONDS } from '@/lib/constants';

type RevealState = 'idle' | 'loading' | 'revealed' | 'destroyed' | 'error' | 'cleared';

export function RevealNote({ id }: { id: string }) {
  const [state, setState] = useState<RevealState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REVEAL_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [fragmentKey, setFragmentKey] = useState('');

  useEffect(() => {
    setFragmentKey(window.location.hash.replace(/^#/, ''));
  }, []);

  useEffect(() => {
    if (state !== 'revealed') return;

    setSecondsLeft(REVEAL_SECONDS);
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setMessage(null);
          setState('cleared');
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state]);

  async function handleReveal() {
    setError(null);

    if (!fragmentKey) {
      setState('error');
      setError('Missing decryption key in the URL fragment.');
      return;
    }

    try {
      setState('loading');
      const { ciphertext } = await readNote(id);

      if (!ciphertext) {
        setState('destroyed');
        return;
      }

      const plaintext = await decryptMessage(ciphertext, fragmentKey);
      setMessage(plaintext);
      setState('revealed');
    } catch (revealError) {
      setState('error');
      setError(revealError instanceof Error ? revealError.message : 'Unable to reveal note.');
    }
  }

  if (state === 'destroyed') {
    return <p className="text-sm text-slate-300">Message no longer available.</p>;
  }

  if (state === 'error') {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  if (state === 'revealed' || state === 'cleared') {
    return (
      <div className="space-y-4">
        {message ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-100">{message}</pre>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Message cleared from the screen.</div>
        )}
        <p className="text-xs text-slate-400">
          {message ? `This view clears in ${secondsLeft}s.` : 'Refresh is not possible after the encrypted payload is consumed.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-300">
        This message will self-destruct after being opened or expired. Once opened, it can still be copied or captured.
      </p>
      <button
        className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
        disabled={state === 'loading'}
        onClick={handleReveal}
        type="button"
      >
        {state === 'loading' ? 'Revealing…' : 'Reveal message'}
      </button>
    </div>
  );
}
