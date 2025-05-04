'use client';

import {
  LexicalComposer,
  type InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  $convertFromMarkdownString,
  HEADING,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  INLINE_CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  QUOTE,
  CODE,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';

interface Props {
  markdown: string;
}

const MARKDOWN_TRANSFORMERS = [
  HEADING,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  INLINE_CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  QUOTE,
  CODE,
];

const initialConfig: InitialConfigType = {
  namespace: 'MarkdownViewer-CodeBlocks',
  editable: false,
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode],
  theme: {
    root: 'prose',
    heading: {
      h1: 'font-bold text-3xl my-4',
      h2: 'font-bold text-2xl my-3',
      h3: 'font-bold text-xl my-2',
    },
    text: {
      bold: 'font-bold',
      italic: 'italic',
      code: 'font-mono bg-gray-100 rounded px-1',
    },
    list: {
      ul: 'list-disc ml-6',
      ol: 'list-decimal ml-6',
      listitem: 'my-1',
    },
    quote: 'border-l-4 pl-3 italic text-gray-600',
    code: 'code-pre',  // Updated to target <pre>
  },
  onError(error) {
    throw error;
  },
};

export default function MarkdownViewer({ markdown }: Props) {
  function AutoLoadPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(
          markdown,
          MARKDOWN_TRANSFORMERS,
          undefined,
          true
        );
      });
    }, [editor, markdown]);

    return null;
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={<span />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={() => {}} />
      <AutoLoadPlugin />
    </LexicalComposer>
  );
}