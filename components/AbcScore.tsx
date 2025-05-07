'use client';

import { useEffect, useRef, useState } from 'react';

export default function AbcScore({ abc }: { abc: string }) {
  const staffRef = useRef<HTMLDivElement>(null);
  const ctrlRef  = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const abcjs = await import('abcjs');
        abcjs.renderAbc(staffRef.current!, abc, { responsive: 'resize' });
        const synth = new abcjs.synth.CreateSynth();
        await synth.init({ visualObj: abcjs.renderAbc(staffRef.current!, abc)[0] });
        const ctrl = new abcjs.synth.SynthController();
        ctrl.load(ctrlRef.current!, {}, { displayRestart: true });
        ctrl.setTune(synth, false).then(() => mounted && ctrlRef.current?.classList.remove('opacity-0'));
      } catch (e: any) { mounted && setErr(e.message ?? 'abcjs error'); }
    })();

    return () => { mounted = false; };
  }, [abc]);

  if (err) return <pre className="text-red-600">{err}</pre>;
  return (
    <figure className="abc-wrap my-6 text-center">
      <div ref={staffRef} className="inline-block" />
      <div ref={ctrlRef}  className="mt-2 opacity-0 transition-opacity" />
    </figure>
  );
}