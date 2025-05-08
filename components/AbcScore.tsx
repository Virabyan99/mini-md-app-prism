'use client';

import { useEffect, useRef, useState } from 'react';

export default function AbcScore({ abc }: { abc: string }) {
  const staffRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const abcjs = await import('abcjs');
        abcjs.renderAbc(staffRef.current!, abc, { responsive: 'resize' });
      } catch (e: any) {
        if (mounted) setErr(e.message ?? 'abcjs error');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [abc]);

  if (err) return <pre className="text-red-600">{err}</pre>;
  return (
    <figure className="abc-wrap my-6 text-center">
      <div ref={staffRef} className="inline-block" />
    </figure>
  );
}