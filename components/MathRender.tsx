'use client';

import { useEffect, useRef, useState } from 'react';
import { sanitize } from '@/lib/sanitizeHtml';

export default function MathRender({ latex, mode }: { latex: string; mode: 'inline' | 'block' }) {
  const host = useRef<HTMLSpanElement | HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    import('katex').then(({ renderToString }) => {
      try {
        const html = renderToString(latex, {
          displayMode: mode === 'block',
          throwOnError: false,
          strict: 'ignore',
        });
        if (mounted && host.current) {
          host.current.innerHTML = sanitize(html);
        }
      } catch (e: any) {
        if (mounted) setErr(e.message);
      }
    });
    return () => {
      mounted = false;
    };
  }, [latex, mode]);

  if (err) return <code className="text-red-600">{err}</code>;
  const Tag = mode === 'block' ? 'div' : 'span';
  return <Tag ref={host} className={mode === 'block' ? 'k-block my-4 ' : ''} />;
}