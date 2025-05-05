'use client';

import { useState } from 'react';

export default function ImageWithControls({
  src,
  alt,
  title,
}: {
  src: string;
  alt: string;
  title?: string | null;
}) {
  const [open, setOpen] = useState(false);

  function saveAs() {
    const a = document.createElement('a');
    a.href = src;
    a.download = alt ? `${alt}.png` : 'image';
    a.click();
  }

  return (
    <>
      <figure className="img-wrap">
        <img src={src} alt={alt} title={title ?? ''} className="img" />
        <div className="overlay">
          <button onClick={() => setOpen(true)} aria-label="Lightbox">
            ⛶
          </button>
          <button onClick={saveAs} aria-label="Save image">
            ⬇
          </button>
        </div>
        {alt && <figcaption className="caption">{alt}</figcaption>}
      </figure>

      {open && (
        <aside className="lightbox" onClick={() => setOpen(false)}>
          <img src={src} alt={alt} />
        </aside>
      )}
    </>
  );
}