import { Card } from '@/components/card';
import { RevealNote } from '@/components/reveal-note';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">Secure note</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Reveal your message</h1>
          <p className="text-sm text-slate-300">Opening this note consumes your encrypted payload</p>
        </div>
        <Card>
          <RevealNote id={id} />
        </Card>
      </div>
    </main>
  );
}
