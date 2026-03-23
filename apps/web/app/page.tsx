import { Card } from '@/components/card';
import { CreateNoteForm } from '@/components/create-note-form';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span>Client-side encryption only</span>
            <span className="opacity-30">•</span>
            <span>Atomic first-read deletion</span>
            <span className="opacity-30">•</span>
            <span>Auto-expiring links</span>
          </div>
        </section>

        <Card>
          <CreateNoteForm />
        </Card>
      </div>
    </main>
  );
}
