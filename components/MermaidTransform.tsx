'use client';

import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { CodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { MermaidNode } from './MermaidNode';

export default function MermaidTransform() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.update(() => {
        $getRoot().getChildren().forEach((n) => {
          if (n instanceof CodeNode && n.getLanguage() === 'mermaid') {
            const code = n.getTextContent();
            n.replace(new MermaidNode(code));
          }
        });
      });
    });
  }, [editor]);
  return null;
}