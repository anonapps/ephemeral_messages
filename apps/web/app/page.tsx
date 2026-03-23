import Link from 'next/link';

import { Card } from '@/components/card';
import { CreateNoteForm } from '@/components/create-note-form';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12">
      <div className="grid w-full flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            Zero-knowledge messaging
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Create encrypted notes that vanish after the first read.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Messages are encrypted in the browser with AES-GCM. The server stores only ciphertext in Redis, while the decryption key stays in the URL fragment.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span>Client-side encryption <span className="text-emerald-400">✔️</span></span>
            <span>Atomic first-read deletion <span className="text-emerald-400">✔️</span></span>
            <span>Auto-expiring links <span className="text-emerald-400">✔️</span></span>
            <span>No logs <span className="text-emerald-400">✔️</span></span>
            <span>Immediate availability <span className="text-emerald-400">✔️</span></span>
          </div>
        </section>

        <Card>
          <CreateNoteForm />
        </Card>
      </div>
      <footer className="pt-10 text-center">
        <Link className="text-sm text-white/40 transition hover:text-white/70" href="/faq">
          FAQ
        </Link>
      </footer>
    </main>
  );
}
