'use client';

import MarkdownViewer from '@/components/MarkdownViewer';
import { useCallback, useState } from 'react';

export default function Home() {
  const [text, setText] = useState<string | null>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.md')) {
      const content = await file.text();
      setText(content);
    } else {
      alert('Please drop a .md file');
    }
  }, []);

  return (
    <main
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="min-h-screen grid place-items-center m-2.5 max-w-4xl mx-auto"
    >
      {text ? (
        <div className="w-full">
          <MarkdownViewer markdown={text} />
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-400 p-16 rounded-xl text-center font-sans"
        >
          Drag a *.md* file here
        </div>
      )}
    </main>
  );
}