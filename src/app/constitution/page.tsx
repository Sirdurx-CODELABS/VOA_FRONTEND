'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { VOALogo } from '@/components/ui/VOALogo';
import { Search, BookOpen, ArrowLeft, ChevronRight, Download, Menu, X, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem { id: string; text: string; level: number; }

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split('\n');
  const toc: TocItem[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      toc.push({ id: slugify(match[2]), text: match[2].replace(/\*\*/g, ''), level: match[1].length });
    }
  }
  return toc;
}

/* ── Cover Page ──────────────────────────────────────────────────────────── */
function CoverPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen gradient-brand-soft flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[#F97316]" />
      </div>

      <div className="relative z-10 text-center text-white max-w-lg animate-bounce-in">
        <VOALogo size={96} onDark />

        <div className="mt-8 mb-2">
          <span className="text-orange-300 text-xs font-bold uppercase tracking-[0.3em]">Official Document</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Voice of Adolescents
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white/80 mt-2">Constitution</h2>
        <p className="text-white/60 mt-4 text-base leading-relaxed max-w-sm mx-auto">
          Guiding Principles, Governance & Member Rights
        </p>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-3 my-8">
          <div className="h-px w-16 bg-white/30" />
          <div className="w-2 h-2 rounded-full bg-[#F97316]" />
          <div className="h-px w-16 bg-white/30" />
        </div>

        <button onClick={onStart}
          className="inline-flex items-center gap-3 bg-white text-[#1E3A8A] font-extrabold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-orange-500/20 hover:scale-105 active:scale-100 transition-all duration-200 text-base">
          <BookOpen className="w-5 h-5" />
          Start Reading
          <ChevronRight className="w-5 h-5" />
        </button>

        <p className="text-white/40 text-xs mt-8">Version 2.0 · 2026 · Voice of Adolescents</p>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function ConstitutionPage() {
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(0);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [showCover, setShowCover] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/voa-constitution.md').then(r => r.text()).then(text => {
      setContent(text);
      setToc(extractToc(text));
    });
  }, []);

  const onScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setProgress(Math.round((scrollTop / Math.max(1, scrollHeight - clientHeight)) * 100));
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll, showCover]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveId(id); setTocOpen(false); }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'VOA-Constitution.md'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = search
    ? content.split('\n').filter(l => l.toLowerCase().includes(search.toLowerCase())).join('\n')
    : content;

  if (showCover) return <CoverPage onStart={() => setShowCover(false)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Progress bar */}
        <div className="h-1 gradient-brand transition-all duration-200" style={{ width: `${progress}%` }} />
        <div className="flex items-center justify-between px-4 md:px-6 h-14 gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <button onClick={() => setShowCover(true)} className="hidden sm:block">
              <VOALogo size={36} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Constitution</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 w-44" />
            </div>
            {/* Progress badge */}
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full hidden sm:block">{progress}% read</span>
            {/* Download */}
            <button onClick={handleDownload} className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            {/* Mobile TOC toggle */}
            <button onClick={() => setTocOpen(!tocOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              {tocOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 gap-8">
        {/* ── TOC Sidebar ──────────────────────────────────────────── */}
        <aside className={cn(
          'shrink-0 w-56',
          'hidden lg:block',
        )}>
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="w-4 h-4 text-[#1E3A8A]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contents</span>
            </div>
            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
              {toc.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={cn(
                    'w-full text-left rounded-lg text-xs font-medium transition-all duration-150',
                    item.level === 1 ? 'px-3 py-2 font-bold' : item.level === 2 ? 'px-4 py-1.5' : 'px-6 py-1',
                    activeId === item.id
                      ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-[#1E3A8A] dark:hover:text-blue-400'
                  )}>
                  {item.text}
                </button>
              ))}
            </nav>

            {/* Progress ring */}
            <div className="mt-6 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="relative w-14 h-14 mx-auto">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#1E3A8A" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
                    strokeLinecap="round" className="transition-all duration-300" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#1E3A8A]">{progress}%</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Reading progress</p>
            </div>
          </div>
        </aside>

        {/* Mobile TOC drawer */}
        {tocOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setTocOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl p-5 overflow-y-auto animate-slide-up">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Contents</p>
              {toc.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)}
                  className={cn('w-full text-left py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors', item.level > 1 && 'pl-4 text-xs')}>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main content ─────────────────────────────────────────── */}
        <main ref={contentRef} className="flex-1 min-w-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Hero */}
          <div className="gradient-brand rounded-2xl p-6 md:p-8 text-white mb-8 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-40 h-40 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-orange-300" />
                <span className="text-orange-300 text-sm font-bold uppercase tracking-wider">Official Document</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">VOA Constitution & Policies</h1>
              <p className="text-white/60 mt-1 text-sm">Voice of Adolescents · Version 2.0 · 2026</p>
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search constitution..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
          </div>

          {/* Markdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-10">
            <div className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:font-extrabold
              prose-h1:text-2xl prose-h1:text-[#1E3A8A] dark:prose-h1:text-blue-400
              prose-h2:text-xl prose-h2:text-[#1E3A8A] dark:prose-h2:text-blue-400
              prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-10
              prose-h3:text-base prose-h3:text-slate-700 dark:prose-h3:text-slate-300
              prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:text-[15px]
              prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-li:text-[15px]
              prose-strong:text-slate-800 dark:prose-strong:text-white
              prose-table:text-sm prose-th:bg-[#1E3A8A]/5 dark:prose-th:bg-slate-800 prose-th:text-[#1E3A8A] dark:prose-th:text-blue-400 prose-th:font-bold
              prose-td:border-slate-100 dark:prose-td:border-slate-800
              prose-blockquote:border-l-[#F97316] prose-blockquote:bg-orange-50 dark:prose-blockquote:bg-orange-900/10 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:not-italic
              prose-a:text-[#F97316] dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
              prose-hr:border-slate-200 dark:prose-hr:border-slate-800
              prose-code:text-[#F97316] prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-1.5 prose-code:rounded-md prose-code:text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => { const id = slugify(String(children)); return <h1 id={id}>{children}</h1>; },
                  h2: ({ children }) => { const id = slugify(String(children)); return <h2 id={id}>{children}</h2>; },
                  h3: ({ children }) => { const id = slugify(String(children)); return <h3 id={id}>{children}</h3>; },
                }}>
                {filtered || '*Loading...*'}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 pb-8">
            VOA Constitution · All rights reserved · Voice of Adolescents
          </div>
        </main>
      </div>
    </div>
  );
}
