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
  LINK,
} from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { useEffect } from 'react';
import { $getRoot, DecoratorNode, type LexicalNode } from 'lexical';
import Prism from '@/lib/prism';
import { HORIZONTAL_RULE } from '@/lib/horizontalRule';
import {
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { FootnoteRefNode } from '@/components/FootnoteRefNode';
import { FOOTNOTES } from '@/lib/footnoteTransformer';
import { fetchLinkPreview } from '@/lib/fetchLinkPreview';
import { ImageNode } from '@/components/ImageNode';
import { IMAGE } from '@/lib/imageTransformer';

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

export class LinkPreviewNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __preview: { title: string; description: string; image: string } | null;

  static getType() {
    return 'link-preview';
  }

  static clone(node: LinkPreviewNode) {
    return new LinkPreviewNode(node.__url, node.__preview, node.__key);
  }

  static importJSON(json: any) {
    return new LinkPreviewNode(json.url, json.preview);
  }

  constructor(url: string, preview: { title: string; description: string; image: string } | null, key?: string) {
    super(key);
    this.__url = url;
    this.__preview = preview;
  }

  createDOM() {
    const a = document.createElement('a');
    a.href = this.__url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <div>
        <a href={this.__url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          {this.__url}
        </a>
        {this.__preview && (
          <div className="mt-1 p-2 border rounded bg-gray-50">
            {this.__preview.image && <img src={this.__preview.image} alt="Preview" className="max-w-xs" />}
            <p className="font-bold">{this.__preview.title}</p>
            <p className="text-sm text-gray-600">{this.__preview.description}</p>
          </div>
        )}
      </div>
    );
  }

  exportJSON() {
    return {
      type: 'link-preview',
      url: this.__url,
      preview: this.__preview,
      version: 1,
    };
  }
}

export const MARKDOWN_TRANSFORMERS = [
  HEADING,
  IMAGE, // Added before other inline transformers
  FOOTNOTES,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  HORIZONTAL_RULE,
  UNORDERED_LIST,
  ORDERED_LIST,
  QUOTE,
  CODE,
  LINK,
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
    HorizontalRuleNode,
    FootnoteRefNode,
    LinkNode,
    LinkPreviewNode,
    ImageNode, // Registered new node
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
    horizontalrule: 'my-6 border-t border-gray-300',
    footnoteref: 'text-xs align-super cursor-help',
    link: 'text-blue-600 underline',
    image: 'img', // Optional: add class for images if needed
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

function LinkPreviewPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateLinkPreviews = () => {
      editor.update(() => {
        const root = $getRoot();
        root.getChildren().forEach((node: LexicalNode) => {
          if (node.getType() === 'link') {
            const url = (node as LinkNode).getURL();
            fetchLinkPreview(url).then((preview) => {
              editor.update(() => {
                const previewNode = new LinkPreviewNode(url, preview || null);
                node.replace(previewNode);
              });
            });
          }
        });
      });
    };

    const unregister = editor.registerUpdateListener(updateLinkPreviews);
    updateLinkPreviews();
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
      <LinkPreviewPlugin />
    </LexicalComposer>
  );
}