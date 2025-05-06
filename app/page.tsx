'use client';

import MarkdownViewer from '@/components/MarkdownViewer';
import { useCallback, useState, useEffect } from 'react';

type Document = {
  id: string;
  name: string;
  markdown: string;
};

export default function Home() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.name.toLowerCase().endsWith('.md')
    );

    if (files.length === 0) {
      alert('Please drop .md files only');
      return;
    }

    const newDocs = await Promise.all(
      files.map(async (file) => {
        const content = await file.text();
        return {
          id: `${file.name}-${Date.now()}`, // Unique ID using timestamp
          name: file.name,
          markdown: content,
        };
      })
    );

    setDocs(prev => {
      const updatedDocs = [...prev, ...newDocs];
      if (!activeTab && updatedDocs.length > 0) {
        setActiveTab(updatedDocs[0].id);
      }
      return updatedDocs;
    });
  }, [activeTab]);

  useEffect(() => {
    if (docs.length === 0) {
      setActiveTab(null);
    } else if (activeTab && !docs.some(doc => doc.id === activeTab)) {
      setActiveTab(docs[0].id);
    }
  }, [docs, activeTab]);

  return (
    <main
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="min-h-screen m-2.5 max-w-4xl mx-auto flex flex-col"
    >
      {docs.length > 0 && (
        <div className="flex overflow-x-auto gap-2 mb-4 border-b border-gray-400">
          {docs.map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveTab(doc.id)}
              className={`group flex items-center max-w-[200px] px-4 py-2 rounded-t-md transition-colors duration-150 ${
                activeTab === doc.id
                  ? 'bg-white border-t border-x border-gray-400'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <span className="flex-grow truncate">{doc.name}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDocs(prev => prev.filter(d => d.id !== doc.id));
                }}
                className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-red-500 cursor-pointer flex-shrink-0"
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex-grow grid place-items-center">
        {docs.length > 0 && activeTab ? (
          <div className="w-full">
            <MarkdownViewer markdown={docs.find(doc => doc.id === activeTab)!.markdown} />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-400 p-16 rounded-xl text-center font-sans">
            Drag *.md* files here
          </div>
        )}
      </div>
    </main>
  );
}