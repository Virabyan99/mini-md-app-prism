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
  STRIKETHROUGH,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
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
import { $getRoot, DecoratorNode } from 'lexical';
import Prism from '@/lib/prism';
import { HORIZONTAL_RULE } from '@/lib/horizontalRule';
import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';

interface Props {
  markdown: string;
}

export class PrismCodeHighlightNode extends DecoratorNode<JSX.Element | null> {
  static getType() {
    return 'prism-code-highlight';
  }

  static clone(node: PrismCodeHighlightNode) {
    return new PrismCodeHighlightNode(node.__key, node.__html);
  }

  static importJSON(json: any) {
    return new PrismCodeHighlightNode();
  }

  createDOM() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.__html;
    return wrapper;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return null;
  }

  exportJSON() {
    return {
      type: 'prism-code-highlight',
      version: 1,
    };
  }

  constructor(key?: string, private __html: string = '') {
    super(key);
  }
}

export const MARKDOWN_TRANSFORMERS = [
  HEADING,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  HORIZONTAL_RULE, // Added before list transformers
  UNORDERED_LIST,
  ORDERED_LIST,
  QUOTE,
  CODE,
];

const initialConfig: InitialConfigType = {
  namespace: 'MarkdownViewer-CodeBlocks',
  editable: false,
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    PrismCodeHighlightNode,
    HorizontalRuleNode, // Registered new node
  ],
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
      boldItalic: 'font-bold italic',
      strikethrough: 'line-through',
      code: 'font-mono bg-gray-100 rounded px-1',
    },
    list: {
      ul: 'list-disc ml-6',
      ol: 'list-decimal ml-6',
      listitem: 'my-1',
    },
    quote: 'border-l-4 pl-3 italic text-gray-600',
    code: 'code-pre',
    horizontalrule: 'my-6 border-t border-gray-300', // Added theme for <hr>
  },
  onError(error) {
    throw error;
  },
};

function PrismHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const highlightCodeBlocks = () => {
      editor.update(() => {
        const root = $getRoot();
        root.getChildren().forEach((n) => {
          if (n.getType() === 'code') {
            const text = n.getTextContent();
            const lang = (n as CodeNode).getLanguage() ?? 'text';
            const html = Prism.highlight(
              text,
              Prism.languages[lang] || Prism.languages.text,
              lang
            );
            const highlightedHtml = `<pre class="language-${lang}"><code>${html}</code></pre>`;
            n.replace(new PrismCodeHighlightNode(undefined, highlightedHtml));
          }
        });
      });
    };

    const unregister = editor.registerUpdateListener(highlightCodeBlocks);
    highlightCodeBlocks();
    return () => unregister();
  }, [editor]);

  return null;
}

function AutoLoadPlugin({ markdown }: { markdown: string }) {
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

export default function MarkdownViewer({ markdown }: Props) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none" />}
        placeholder={<span />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={() => {}} />
      <AutoLoadPlugin markdown={markdown} />
      <PrismHighlightPlugin />
    </LexicalComposer>
  );
}