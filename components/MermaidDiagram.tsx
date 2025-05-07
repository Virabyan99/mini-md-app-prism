'use client';

import { useEffect, useRef, useState } from 'react';
import { sanitize } from '@/lib/sanitizeHtml';

export default function MermaidDiagram({ code }: { code: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

        const { svg } = await mermaid.render('m_' + Math.random().toString(36).slice(2), code);
        if (mounted && host.current) {
          host.current.innerHTML = sanitize(svg); // XSS-safe
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? 'Mermaid error');
      }
    }
    render();
    return () => {
      mounted = false;
    };
  }, [code]);

  if (error) {
    return <pre className="text-red-600">{error}</pre>;
  }
  return <div ref={host} className="mermaid-wrap text-center my-4" />;
}