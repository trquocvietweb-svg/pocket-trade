'use client';

import {
  $applyNodeReplacement,
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $getRoot,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  createCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

export type InsertImagePayload = {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

type SerializedImageNode = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  type: 'image';
  version: 1;
} & SerializedLexicalNode;

function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt } = domNode;
    let width = domNode.getAttribute('width');
    let height = domNode.getAttribute('height');
    
    if (!width && domNode.style.width) {
      width = domNode.style.width.replace('px', '');
    }
    if (!height && domNode.style.height) {
      height = domNode.style.height.replace('px', '');
    }
    
    const node = $createImageNode({ 
      src, 
      altText: alt || '',
      width: width ? parseInt(width, 10) : undefined,
      height: height ? parseInt(height, 10) : undefined,
    });
    return { node };
  }
  return null;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ src, altText, width, height });
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', String(this.__width));
      element.style.width = `${this.__width}px`;
    }
    if (this.__height) {
      element.setAttribute('height', String(this.__height));
      element.style.height = `${this.__height}px`;
    }
    element.style.maxWidth = '100%';
    element.style.borderRadius = '4px';
    element.style.display = 'block';
    element.style.margin = '8px 0';
    return { element };
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  setWidthAndHeight(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createImageNode({
  src,
  altText = '',
  width,
  height,
}: InsertImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height));
}

export function $isImageNode(node?: LexicalNode | null): node is ImageNode {
  return node instanceof ImageNode;
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (isResizing) return true;
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
    );
  }, [editor, onClick, onDelete]);

  const onResizeEnd = (nextWidth: number, nextHeight: number) => {
    setTimeout(() => setIsResizing(false), 200);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const isFocused = isSelected || isResizing;

  return (
    <div 
      className={`image-wrapper ${isFocused ? 'focused' : ''}`}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          borderRadius: '4px',
          display: 'block',
          cursor: 'default',
          outline: isFocused ? '2px solid #3b82f6' : 'none',
        }}
        draggable={false}
      />
      {isFocused && (
        <ImageResizer
          imageRef={imageRef}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          editor={editor}
        />
      )}
    </div>
  );
}

function ImageResizer({
  imageRef,
  onResizeStart,
  onResizeEnd,
  editor,
}: {
  imageRef: React.RefObject<HTMLImageElement | null>;
  onResizeStart: () => void;
  onResizeEnd: (width: number, height: number) => void;
  editor: LexicalEditor;
}): JSX.Element {
  const positioningRef = useRef({
    currentWidth: 0,
    currentHeight: 0,
    ratio: 1,
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0,
    isResizing: false,
  });

  const editorRoot = editor.getRootElement();
  const maxWidth = editorRoot ? editorRoot.getBoundingClientRect().width - 40 : 800;
  const minWidth = 50;

  const handlePointerDown = (event: React.PointerEvent, corner: string) => {
    if (!editor.isEditable()) return;
    const image = imageRef.current;
    if (!image) return;

    event.preventDefault();
    const { width, height } = image.getBoundingClientRect();
    const pos = positioningRef.current;
    pos.startWidth = width;
    pos.startHeight = height;
    pos.ratio = width / height;
    pos.currentWidth = width;
    pos.currentHeight = height;
    pos.startX = event.clientX;
    pos.startY = event.clientY;
    pos.isResizing = true;

    onResizeStart();
    document.body.style.cursor = `${corner}-resize`;
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!pos.isResizing || !image) return;
      
      const diffX = moveEvent.clientX - pos.startX;
      let newWidth = pos.startWidth;

      if (corner.includes('e')) newWidth = pos.startWidth + diffX;
      if (corner.includes('w')) newWidth = pos.startWidth - diffX;

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      const newHeight = newWidth / pos.ratio;

      pos.currentWidth = newWidth;
      pos.currentHeight = newHeight;
      
      image.style.width = `${newWidth}px`;
      image.style.height = `${newHeight}px`;
    };

    const handlePointerUp = () => {
      if (pos.isResizing) {
        pos.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onResizeEnd(Math.round(pos.currentWidth), Math.round(pos.currentHeight));
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    borderRadius: '2px',
  };

  return (
    <>
      <div
        style={{ ...handleStyle, top: -5, right: -5, cursor: 'ne-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'ne')}
      />
      <div
        style={{ ...handleStyle, bottom: -5, right: -5, cursor: 'se-resize' }}
        onPointerDown={(e) => handlePointerDown(e, 'se')}
      />
    </>
  );
}

const ImagesPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<InsertImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);

        const insertAtSelection = (sel: ReturnType<typeof $getSelection>) => {
          if ($isRangeSelection(sel) || $isNodeSelection(sel)) {
            sel.insertNodes([imageNode]);
            return true;
          }
          return false;
        };

        const selection = $getSelection();
        let inserted = insertAtSelection(selection);

        if (!inserted) {
          const root = $getRoot();
          root.selectEnd();
          const selAfterFocus = $getSelection();
          inserted = insertAtSelection(selAfterFocus);
          if (!inserted) {
            root.append(imageNode);
            const nodeSelection = $createNodeSelection();
            nodeSelection.add(imageNode.getKey());
            $setSelection(nodeSelection);
          }
        }

        const parent = imageNode.getParent();
        if ($isParagraphNode(parent)) {
          parent.insertAfter(imageNode);
          parent.remove();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
};

export default ImagesPlugin;
