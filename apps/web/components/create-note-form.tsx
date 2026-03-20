'use client';

import { FormEvent, useMemo, useState } from 'react';

import { createNote } from '@/lib/api';
import { encryptMessage } from '@/lib/crypto';
import { MAX_BYTES, SOFT_WARNING_BYTES, TTL_OPTIONS } from '@/lib/constants';

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function CreateNoteForm() {
  const [message, setMessage] = useState('');
  const [ttl, setTtl] = useState<number>(TTL_OPTIONS[2].value);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const byteLength = useMemo(() => new TextEncoder().encode(message).length, [message]);
  const isTooLarge = byteLength > MAX_BYTES;
  const showSoftWarning = byteLength > SOFT_WARNING_BYTES;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShareUrl(null);

    if (!message.trim()) {
      setError('Enter a message before creating a link.');
      return;
    }

    if (isTooLarge) {
      setError('Message exceeds the 100 KB limit.');
      return;
    }

    try {
      setSubmitting(true);
      const { key, payload } = await encryptMessage(message);
      const { id } = await createNote(payload, ttl);
      const url = `${window.location.origin}/note/${id}#${key}`;
      setShareUrl(url);
      setMessage('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create secure link.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200" htmlFor="message">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type a plaintext message. Encryption happens only in your browser."
            className="min-h-56 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={isTooLarge ? 'text-rose-300' : showSoftWarning ? 'text-amber-300' : 'text-slate-400'}>
              {formatBytes(byteLength)} / {formatBytes(MAX_BYTES)}
            </span>
            {showSoftWarning ? <span className="text-amber-300">Large messages may feel slower to encrypt.</span> : null}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">Expires after</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {TTL_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${ttl === option.value ? 'border-cyan-400 bg-cyan-400/10 text-cyan-50' : 'border-white/10 bg-white/5 text-slate-300'}`}
              >
                <input
                  checked={ttl === option.value}
                  className="accent-cyan-400"
                  name="ttl"
                  onChange={() => setTtl(option.value)}
                  type="radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          This message will self-destruct after being opened or expired. Once opened, it can still be copied or captured.
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating secure link…' : 'Create self-destructing link'}
        </button>
      </form>

      {shareUrl ? (
        <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
          <p>Share this link. The decryption key is only inside the URL fragment and is never sent to the server.</p>
          <code className="block overflow-x-auto rounded-xl bg-slate-950/70 p-3 text-xs text-slate-100">{shareUrl}</code>
          <button className="rounded-xl border border-emerald-300/30 px-3 py-2 font-medium" onClick={handleCopy} type="button">
            Copy link
          </button>
        </div>
      ) : null}
    </div>
  );
}
