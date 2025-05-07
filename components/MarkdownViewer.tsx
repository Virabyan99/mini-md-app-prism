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
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { useEffect, useState } from 'react';
import {
  $getRoot,
  DecoratorNode,
  type LexicalNode,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createLinkNode } from '@lexical/link';
import { $createHorizontalRuleNode, HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import Prism from '@/lib/prism';
import { fetchLinkPreview } from '@/lib/fetchLinkPreview';
import { ImageNode } from '@/components/ImageNode';
import { FootnoteRefNode } from '@/components/FootnoteRefNode';
import { remark } from 'remark';
import gfm from 'remark-gfm';
import math from 'remark-math';
import { MermaidNode } from './MermaidNode';
import MermaidTransform from './MermaidTransform';
import { MathNode } from './MathNode';
import katex from 'katex';

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

function extractTableData(tableNode: any): { headers: string[], alignments: (string | null)[], rows: string[][] } {
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

function createInlineNodes(node: any): LexicalNode[] {
  if (node.type === 'text') {
    return [$createTextNode(node.value)];
  } else if (node.type === 'inlineMath') {
    console.log('Creating inline math node:', node.value);
    const mathNode = new MathNode(node.value.trim(), 'inline');
    return [mathNode];
  } else if (node.type === 'strong') {
    const textNode = $createTextNode(node.children[0].value);
    textNode.setFormat('bold');
    return [textNode];
  } else if (node.type === 'emphasis') {
    const textNode = $createTextNode(node.children[0].value);
    textNode.setFormat('italic');
    return [textNode];
  } else if (node.type === 'delete') {
    const textNode = $createTextNode(node.children[0].value);
    textNode.setFormat('strikethrough');
    return [textNode];
  } else if (node.type === 'inlineCode') {
    const textNode = $createTextNode(node.value);
    textNode.setFormat('code');
    return [textNode];
  } else if (node.type === 'link') {
    const href = node.url;
    const textNodes = node.children.flatMap(createInlineNodes);
    const linkNode = $createLinkNode(href);
    textNodes.forEach(node => linkNode.append(node));
    return [linkNode];
  } else {
    return [];
  }
}

function createLexicalNodesFromAST(node: any): LexicalNode | null {
  switch (node.type) {
    case 'paragraph':
      const paragraphNode = $createParagraphNode();
      node.children.forEach((child: any) => {
        const inlineNodes = createInlineNodes(child);
        inlineNodes.forEach(inlineNode => paragraphNode.append(inlineNode));
      });
      return paragraphNode;
    case 'heading':
      const headingLevel = node.depth;
      const headingNode = $createHeadingNode(`h${headingLevel}`);
      node.children.forEach((child: any) => {
        const inlineNodes = createInlineNodes(child);
        inlineNodes.forEach(inlineNode => headingNode.append(inlineNode));
      });
      return headingNode;
    case 'thematicBreak':
      return $createHorizontalRuleNode();
    case 'blockquote':
      const quoteNode = $createQuoteNode();
      node.children.forEach((child: any) => {
        const blockNode = createLexicalNodesFromAST(child);
        if (blockNode) {
          quoteNode.append(blockNode);
        }
      });
      return quoteNode;
    case 'list':
      const isOrdered = node.ordered;
      const isTaskList = !isOrdered && node.children.every((item: any) => item.checked !== null);
      const listType = isOrdered ? 'number' : isTaskList ? 'check' : 'bullet';
      const listNode = $createListNode(listType);
      node.children.forEach((item: any) => {
        const listItemNode = $createListItemNode();
        if (isTaskList) {
          listItemNode.setChecked(item.checked);
        } else if (item.checked !== null) {
          const symbol = item.checked ? '☑ ' : '☐ ';
          const symbolNode = $createTextNode(symbol);
          listItemNode.append(symbolNode);
        }
        item.children.forEach((child: any) => {
          const blockNode = createLexicalNodesFromAST(child);
          if (blockNode) {
            listItemNode.append(blockNode);
          }
        });
        listNode.append(listItemNode);
      });
      return listNode;
    case 'code':
      if (node.lang === 'math') {
        console.log('Creating block math node:', node.value);
        const mathNode = new MathNode(node.value.trim(), 'block');
        return mathNode;
      }
      const codeNode = $createCodeNode(node.lang || '');
      const textNode = $createTextNode(node.value);
      codeNode.append(textNode);
      return codeNode;
    case 'math':
      console.log('Creating block math node:', node.value);
      const mathNode = new MathNode(node.value.trim(), 'block');
      return mathNode;
    case 'table':
      const tableData = extractTableData(node);
      return new TableNode(tableData);
    default:
      return null;
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

function MathRender({ latex, mode }: { latex: string; mode: 'inline' | 'block' }) {
  const [html, setHtml] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const renderedHtml = katex.renderToString(latex, {
        displayMode: mode === 'block',
        throwOnError: false,
        strict: 'ignore',
      });
      setHtml(renderedHtml);
    } catch (e: any) {
      setErr(e.message);
    }
  }, [latex, mode]);

  if (err) return <code className="text-red-600">{err}</code>;
  const Tag = mode === 'block' ? 'div' : 'span';
  return <Tag className={mode === 'block' ? 'k-block my-4 text-center' : ''} dangerouslySetInnerHTML={{ __html: html }} />;
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
    MermaidNode,
    MathNode,
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
    const processor = remark().use(gfm).use(math);
    const ast = processor.parse(markdown);
    console.log('Parsed AST:', JSON.stringify(ast, null, 2));
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

function EditorPlugins({ markdown }: { markdown: string }) {
  return (
    <>
      <AutoLoadPlugin markdown={markdown} />
      <PrismHighlightPlugin />
      <LinkPreviewPlugin />
      <MermaidTransform />
    </>
  );
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
      <EditorPlugins markdown={markdown} />
    </LexicalComposer>
  );
}