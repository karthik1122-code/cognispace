import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { sanitizeHtml } from '../utils/sanitize';
import { Logo } from '../components/landing/Logo';

interface Shared { title: string; icon?: string; cover?: string | null; content: string; updatedAt?: string }

/** Public, read-only view of a page someone shared. The HTML is sanitized before it is shown. */
export function SharedPage({ shareId }: { shareId: string }) {
  const [doc, setDoc] = useState<Shared | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let off = false;
    fetch(apiUrl(`/api/share/${encodeURIComponent(shareId)}`))
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'This link does not work any more.'); return d; })
      .then((d) => { if (!off) { setDoc(d); document.title = `${d.title || 'Untitled'} · CogniSpace`; } })
      .catch((e) => { if (!off) setError(e.message); });
    return () => { off = true; };
  }, [shareId]);

  return (
    <div className="min-h-screen bg-app text-fg">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <a href="/" aria-label="CogniSpace home"><Logo /></a>
        <span className="flex items-center gap-1.5 text-[12.5px] text-muted"><Lock size={12} /> Read-only page</span>
      </header>
      {error && (
        <main className="mx-auto max-w-[680px] px-6 py-24 text-center">
          <h1 className="text-[24px] font-semibold">{error}</h1>
          <p className="mt-2 text-muted">The owner may have stopped sharing it or deleted the page.</p>
          <a href="/" className="btn-primary mt-6 inline-flex">Go to CogniSpace</a>
        </main>
      )}
      {!error && !doc && <main className="mx-auto max-w-[760px] px-6 py-16" role="status" aria-label="Loading"><div className="h-10 w-2/3 animate-pulse rounded bg-fg/10" /><div className="mt-6 h-4 w-full animate-pulse rounded bg-fg/10" /></main>}
      {doc && (
        <main className="mx-auto max-w-[760px] px-6 pb-24 pt-10">
          {doc.cover && <div className="mb-8 h-36 rounded-2xl" style={{ background: doc.cover.startsWith('linear-gradient') ? doc.cover : undefined }} aria-hidden />}
          <div className="text-[44px] leading-none" aria-hidden>{doc.icon}</div>
          <h1 className="mt-4 text-[38px] font-bold leading-tight tracking-[-0.03em]">{doc.title || 'Untitled'}</h1>
          {doc.updatedAt && <p className="mt-2 text-[13px] text-muted">Last edited {new Date(doc.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
          <article className="doc-editor mt-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(doc.content) }} />
          <footer className="mt-16 border-t border-line pt-6 text-[13px] text-muted">Written in CogniSpace. <a href="/" className="text-accent hover:underline">Make your own workspace</a></footer>
        </main>
      )}
    </div>
  );
}

export default SharedPage;
