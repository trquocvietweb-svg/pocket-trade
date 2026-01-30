'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  TextNode,
  $applyNodeReplacement,
  $isElementNode,
  $isDecoratorNode,
  $isTextNode,
  LexicalNode,
  type DOMConversionMap,
  type DOMConversion,
  type DOMConversionOutput,
  type SerializedTextNode,
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { $setBlocksType } from '@lexical/selection';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Heading1,
  Heading2,
  Quote,
  Image as ImageIcon,
  Loader2,
  FileCode,
} from 'lucide-react';
import ImagesPlugin, { ImageNode, INSERT_IMAGE_COMMAND } from './nodes/ImageNode';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

const theme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
  },
  link: 'text-indigo-500 hover:underline',
  quote: 'editor-quote',
};

export class ExtendedTextNode extends TextNode {
  static getType(): string {
    return 'extended-text';
  }

  static clone(node: ExtendedTextNode): ExtendedTextNode {
    return new ExtendedTextNode(node.__text, node.__key);
  }

  static importDOM(): DOMConversionMap | null {
    const importers = TextNode.importDOM();
    return {
      ...importers,
      span: () => ({
        conversion: patchStyleConversion(importers?.span),
        priority: 1,
      }),
      strong: () => ({
        conversion: patchStyleConversion(importers?.strong),
        priority: 1,
      }),
      em: () => ({
        conversion: patchStyleConversion(importers?.em),
        priority: 1,
      }),
      u: () => ({
        conversion: patchStyleConversion(importers?.u),
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedTextNode): ExtendedTextNode {
    return $createExtendedTextNode().updateFromJSON(serializedNode);
  }
}

function patchStyleConversion(
  originalDOMConverter?: (node: HTMLElement) => DOMConversion | null
): (node: HTMLElement) => DOMConversionOutput | null {
  return (node) => {
    const original = originalDOMConverter?.(node);
    if (!original) {
      return null;
    }
    const originalOutput = original.conversion(node);

    if (!originalOutput) {
      return originalOutput;
    }

    const backgroundColor = node.style.backgroundColor;
    const color = node.style.color;
    const fontFamily = node.style.fontFamily;
    const fontSize = node.style.fontSize;

    return {
      ...originalOutput,
      forChild: (lexicalNode, parent) => {
        const originalForChild = originalOutput?.forChild ?? ((x) => x);
        const result = originalForChild(lexicalNode, parent);
        if ($isTextNode(result)) {
          const style = [
            backgroundColor ? `background-color: ${backgroundColor}` : null,
            color ? `color: ${color}` : null,
            fontFamily ? `font-family: ${fontFamily}` : null,
            fontSize ? `font-size: ${fontSize}` : null,
          ]
            .filter((value) => value != null)
            .join('; ');
          if (style.length) {
            return result.setStyle(style);
          }
        }
        return result;
      },
    };
  };
}

export function $createExtendedTextNode(text: string = ''): ExtendedTextNode {
  return $applyNodeReplacement(new ExtendedTextNode(text));
}

export function $isExtendedTextNode(
  node: LexicalNode | null | undefined
): node is ExtendedTextNode {
  return node instanceof ExtendedTextNode;
}

const FONT_FAMILY_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Verdana', value: 'Verdana' },
];

const FONT_SIZE_OPTIONS = [
  { label: '10px', value: '10px' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '30px', value: '30px' },
];

function ToolbarPlugin({ onImageUpload }: { onImageUpload?: (file: File) => Promise<string | null> }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [fontSize, setFontSize] = useState('14px');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontColor, setFontColor] = useState('#000000');
  const [isUploading, setIsUploading] = useState(false);
  const [showMarkdownInput, setShowMarkdownInput] = useState(false);
  const [markdownText, setMarkdownText] = useState('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

      const currentFontSize = selection.style.split(';')
        .find(s => s.includes('font-size'))
        ?.split(':')[1]?.trim() || '14px';

      const currentFontFamily = selection.style.split(';')
        .find(s => s.includes('font-family'))
        ?.split(':')[1]?.trim().replace(/['"]/g, '') || 'Inter';

      const currentFontColor = selection.style.split(';')
        .find(s => s.includes('color') && !s.includes('background'))
        ?.split(':')[1]?.trim() || '#000000';

      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setBlockType(element.getType());
      setFontSize(currentFontSize);
      setFontFamily(currentFontFamily);
      setFontColor(currentFontColor);
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatBold = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  const formatItalic = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  const formatUnderline = () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  const insertBulletList = () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  const insertNumberedList = () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  const undo = () => editor.dispatchCommand(UNDO_COMMAND, undefined);
  const redo = () => editor.dispatchCommand(REDO_COMMAND, undefined);

  const formatBlock = (type: string) => {
    if (type === 'h1') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h1'));
      });
    } else if (type === 'h2') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h2'));
      });
    } else if (type === 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
      });
    } else if (type === 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createParagraphNode());
      });
    } else if (type === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (type === 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const applyStyleText = (styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyStyleText({ 'font-size': e.target.value });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyStyleText({ 'font-family': e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyStyleText({ color: e.target.value });
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && onImageUpload) {
        setIsUploading(true);
        try {
          const url = await onImageUpload(file);
          if (url) {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: '' });
          }
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error('Không thể tải ảnh lên');
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  const handleImportMarkdown = () => {
    if (!markdownText.trim()) {
      toast.error('Vui lòng nhập nội dung Markdown');
      return;
    }
    
    editor.update(() => {
      $convertFromMarkdownString(markdownText, TRANSFORMERS);
    });
    
    setMarkdownText('');
    setShowMarkdownInput(false);
    toast.success('Đã import Markdown thành công');
  };

  const btnClass = (active: boolean) =>
    `p-2 rounded transition-colors ${
      active
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`;

  const Divider = () => <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
      <select
        value={fontFamily}
        onChange={handleFontFamilyChange}
        className="h-7 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2"
        title="Font chữ"
      >
        {FONT_FAMILY_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <select
        value={fontSize}
        onChange={handleFontSizeChange}
        className="h-7 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2"
        title="Cỡ chữ"
      >
        {FONT_SIZE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <input
        type="color"
        value={fontColor}
        onChange={handleColorChange}
        className="h-7 w-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
        title="Màu chữ"
      />

      <Divider />

      <button type="button" onClick={undo} className={btnClass(false)} title="Hoàn tác">
        <Undo size={16} />
      </button>
      <button type="button" onClick={redo} className={btnClass(false)} title="Làm lại">
        <Redo size={16} />
      </button>

      <Divider />

      <button type="button" onClick={formatBold} className={btnClass(isBold)} title="In đậm">
        <Bold size={16} />
      </button>
      <button type="button" onClick={formatItalic} className={btnClass(isItalic)} title="In nghiêng">
        <Italic size={16} />
      </button>
      <button type="button" onClick={formatUnderline} className={btnClass(isUnderline)} title="Gạch chân">
        <Underline size={16} />
      </button>

      <Divider />

      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} className={btnClass(false)} title="Căn trái">
        <AlignLeft size={16} />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} className={btnClass(false)} title="Căn giữa">
        <AlignCenter size={16} />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} className={btnClass(false)} title="Căn phải">
        <AlignRight size={16} />
      </button>

      <Divider />

      <button type="button" onClick={() => formatBlock('paragraph')} className={btnClass(blockType === 'paragraph')} title="Văn bản thường">
        <Type size={16} />
      </button>
      <button type="button" onClick={() => formatBlock('h1')} className={btnClass(blockType === 'heading' || blockType === 'h1')} title="Tiêu đề 1">
        <Heading1 size={16} />
      </button>
      <button type="button" onClick={() => formatBlock('h2')} className={btnClass(blockType === 'h2')} title="Tiêu đề 2">
        <Heading2 size={16} />
      </button>
      <button type="button" onClick={() => formatBlock('quote')} className={btnClass(blockType === 'quote')} title="Trích dẫn">
        <Quote size={16} />
      </button>

      <Divider />

      <button type="button" onClick={insertBulletList} className={btnClass(false)} title="Danh sách chấm">
        <List size={16} />
      </button>
      <button type="button" onClick={insertNumberedList} className={btnClass(false)} title="Danh sách số">
        <ListOrdered size={16} />
      </button>

      <Divider />

      <button type="button" onClick={handleImageUpload} className={btnClass(false)} title="Tải ảnh lên">
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
      </button>
      
      <div className="relative">
        <button type="button" onClick={() => setShowMarkdownInput(!showMarkdownInput)} className={btnClass(showMarkdownInput)} title="Import Markdown">
          <FileCode size={16} />
        </button>
        
        {showMarkdownInput && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMarkdownInput(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-20">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nhập Markdown
              </label>
              <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                placeholder="# Tiêu đề&#10;&#10;Nội dung **in đậm** và *in nghiêng*&#10;&#10;- Item 1&#10;- Item 2"
                className="w-full h-48 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleImportMarkdown}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMarkdownText('');
                    setShowMarkdownInput(false);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                >
                  Hủy
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InitialContentPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current || !initialHtml) return;
    isInitializedRef.current = true;
    
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      
      const validNodes: LexicalNode[] = [];
      for (const node of nodes) {
        if ($isElementNode(node) || $isDecoratorNode(node)) {
          validNodes.push(node);
        } else if ($isTextNode(node)) {
          const text = node.getTextContent().trim();
          if (text) {
            const paragraph = $createParagraphNode();
            paragraph.append(node);
            validNodes.push(paragraph);
          }
        }
      }
      
      if (validNodes.length > 0) {
        root.append(...validNodes);
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(''));
        root.append(paragraph);
      }
    });
  }, [editor, initialHtml]);

  return null;
}

const PasteImagePlugin: React.FC<{ onImageUpload: (file: File) => Promise<string | null> }> = ({ onImageUpload }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const url = await onImageUpload(file);
              if (url) {
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: '' });
              }
            } catch (error) {
              console.error('Paste image error:', error);
            }
          }
          break;
        }
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('paste', handlePaste as unknown as EventListener);
      return () => {
        rootElement.removeEventListener('paste', handlePaste as unknown as EventListener);
      };
    }
  }, [editor, onImageUpload]);

  return null;
};

interface LexicalEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  postId?: string;
}

export default function LexicalEditor({ value, onChange, placeholder = 'Nhập nội dung...', postId }: LexicalEditorProps) {
  void postId;
  const uploadImage = useMutation(api.files.generateUploadUrl);
  
  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return null;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return null;
    }
    
    try {
      const uploadUrl = await uploadImage();
      
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error('Upload failed');
      
      const { storageId } = await result.json();
      const imageUrl = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
      
      return imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải ảnh lên');
      return null;
    }
  }, [uploadImage]);

  const initialConfig = {
    namespace: 'PostEditor',
    theme,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      ImageNode,
      ExtendedTextNode,
      {
        replace: TextNode,
        with: (node: TextNode) => {
          return new ExtendedTextNode(node.__text);
        },
        withKlass: ExtendedTextNode,
      },
    ],
    onError: (error: Error) => console.error(error),
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm w-full">
        <ToolbarPlugin onImageUpload={handleImageUpload} />
        <div className="relative min-h-[300px]">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none min-h-[300px] p-4 prose prose-sm dark:prose-invert max-w-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-slate-400 pointer-events-none text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <ImagesPlugin />
        <PasteImagePlugin onImageUpload={handleImageUpload} />
        <InitialContentPlugin initialHtml={value} />
        <OnChangePlugin onChange={(editorState, editor) => {
          editorState.read(() => {
            const html = $generateHtmlFromNodes(editor);
            onChange(html);
          });
        }} />
      </div>
      <style jsx global>{`
        .editor-paragraph { margin: 0 0 8px 0; }
        .editor-heading-h1 { font-size: 24px; font-weight: bold; margin: 0 0 12px 0; }
        .editor-heading-h2 { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; }
        .editor-quote { border-left: 4px solid #cbd5e1; margin: 8px 0; padding-left: 16px; color: #64748b; font-style: italic; }
        .editor-list-ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
        .editor-list-ol { list-style-type: decimal; padding-left: 24px; margin: 8px 0; }
        .editor-listitem { margin: 4px 0; }
        .editor-text-bold { font-weight: bold; }
        .editor-text-italic { font-style: italic; }
        .editor-text-underline { text-decoration: underline; }
      `}</style>
    </LexicalComposer>
  );
}
