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
  $createHeadingNode,
  
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import { $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { useEffect } from 'react';
import { $createParagraphNode, $createTextNode, $getRoot, DecoratorNode, type LexicalNode } from 'lexical';
import Prism from '@/lib/prism';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { FootnoteRefNode } from '@/components/FootnoteRefNode';
import { fetchLinkPreview } from '@/lib/fetchLinkPreview';
import { ImageNode } from '@/components/ImageNode';
import { remark } from 'remark';
import gfm from 'remark-gfm';

interface Props {
  markdown: string;
}

export class TableNode extends DecoratorNode<JSX.Element> {
  __tableData: { headers: string[], alignments: (string | null)[], rows: string[][] };

  static getType() {
    return 'table';
  }

  static clone(node: TableNode) {
    return new TableNode(node.__tableData, node.__key);
  }

  static importJSON(json: any) {
    return new TableNode(json.tableData);
  }

  constructor(tableData: { headers: string[], alignments: (string | null)[], rows: string[][] }, key?: string) {
    super(key);
    this.__tableData = tableData;
  }

  createDOM() {
    const div = document.createElement('div');
    div.className = 'table-container';
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    const { headers, alignments, rows } = this.__tableData;
    return (
      <div className="table-container">
        <table className="table border-collapse border border-gray-400 w-full my-4">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="border border-gray-300 px-4 py-2 bg-gray-100"
                  style={{ textAlign: alignments[i] || 'left' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border border-gray-300 px-4 py-2"
                    style={{ textAlign: alignments[j] || 'left' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  exportJSON() {
    return {
      type: 'table',
      tableData: this.__tableData,
      version: 1,
    };
  }
}

type TableData = {
  headers: string[],
  alignments: (string | null)[],
  rows: string[][]
};

function extractTableData(tableNode: any): TableData {
  const headerRow = tableNode.children[0];
  const headers = headerRow.children.map((cell: any) => cell.children[0]?.value || '');
  const separatorRow = tableNode.children[1];
  const alignments = separatorRow.children.map((cell: any) => {
    const text = cell.children[0]?.value.trim() || '';
    if (text.startsWith(':') && text.endsWith(':')) return 'center';
    if (text.startsWith(':')) return 'left';
    if (text.endsWith(':')) return 'right';
    return null;
  });
  const rows = tableNode.children.slice(2).map((row: any) =>
    row.children.map((cell: any) => cell.children[0]?.value || '')
  );
  return { headers, alignments, rows };
}

function createLexicalNodesFromAST(node: any): LexicalNode | null {
  switch (node.type) {
    case 'heading':
      const headingNode = $createHeadingNode(`h${node.depth}`);
      node.children.forEach((child: any) => {
        const inlineNodes = createInlineNodes(child);
        inlineNodes.forEach((inlineNode) => headingNode.append(inlineNode));
      });
      return headingNode;
    case 'paragraph':
      const paragraphNode = $createParagraphNode();
      node.children.forEach((child: any) => {
        const inlineNodes = createInlineNodes(child);
        inlineNodes.forEach((inlineNode) => paragraphNode.append(inlineNode));
      });
      return paragraphNode;
    case 'table':
      const tableData = extractTableData(node);
      return new TableNode(tableData);
    case 'blockquote':
      const quoteNode = $createQuoteNode();
      node.children.forEach((child: any) => {
        const blockNode = createLexicalNodesFromAST(child);
        if (blockNode) {
          quoteNode.append(blockNode);
        }
      });
      return quoteNode;
    case 'code':
      const codeNode = $createCodeNode(node.lang);
      codeNode.append($createTextNode(node.value));
      return codeNode;
    default:
      return null;
  }
}

function createInlineNodes(node: any): LexicalNode[] {
  switch (node.type) {
    case 'text':
      return [$createTextNode(node.value)];
    case 'strong':
      const strongNode = $createTextNode(node.children[0].value);
      strongNode.setFormat('bold');
      return [strongNode];
    case 'emphasis':
      const italicNode = $createTextNode(node.children[0].value);
      italicNode.setFormat('italic');
      return [italicNode];
    default:
      return [];
  }
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
    ImageNode,
    TableNode,
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
    image: 'img',
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
    const processor = remark().use(gfm);
    const ast = processor.parse(markdown);
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      ast.children.forEach((astNode: any) => {
        const lexicalNode = createLexicalNodesFromAST(astNode);
        if (lexicalNode) {
          root.append(lexicalNode);
        }
      });
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